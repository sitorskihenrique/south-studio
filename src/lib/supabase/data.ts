"use client";

import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";
import {
  acknowledgeCloudOperations,
  applyCloudOutbox,
  enqueueCloudOperation,
  readCloudOutbox,
  type CloudTableName,
} from "./outbox";

export type CloudTable = CloudTableName;

type CloudRow<T> = {
  id: string;
  title: string | null;
  data: T;
  updated_at: string;
};

export type CloudResult<T> = {
  authenticated: boolean;
  ok: boolean;
  items: T[];
  error?: string;
};

export type CloudWriteResult = {
  authenticated: boolean;
  ok: boolean;
  queued?: boolean;
  error?: string;
};

function projectIdFor(item: unknown) {
  if (!item || typeof item !== "object" || !("projectId" in item)) return null;
  const projectId = (item as { projectId?: unknown }).projectId;
  return typeof projectId === "string" && projectId ? projectId : null;
}

let userCache: { user: User | null; expiresAt: number } | null = null;
let userRequest: Promise<User | null> | null = null;
const itemsCache = new Map<CloudTable, { userId: string; items: unknown[]; expiresAt: number }>();
const itemsRequests = new Map<CloudTable, Promise<CloudResult<unknown>>>();
const flushRequests = new Map<string, Promise<boolean>>();

export function setCloudAuthUser(user: User | null) {
  if (userCache?.user?.id !== user?.id) {
    itemsCache.clear();
    itemsRequests.clear();
    flushRequests.clear();
  }
  userCache = { user, expiresAt: Date.now() + 60_000 };
  userRequest = null;
}

async function getCurrentUser() {
  if (userCache && userCache.expiresAt > Date.now()) return userCache.user;
  if (userRequest) return userRequest;

  const supabase = createClient();
  if (!supabase) return null;
  userRequest = supabase.auth.getUser().then(({ data, error }) => {
    const user = error ? null : data.user;
    userCache = { user, expiresAt: Date.now() + 10_000 };
    userRequest = null;
    return user;
  }).catch(() => {
    userCache = { user: null, expiresAt: Date.now() + 3_000 };
    userRequest = null;
    return null;
  });
  return userRequest;
}

export async function readCloudItems<T extends { id: string }>(
  table: CloudTable,
  options: { force?: boolean } = {},
): Promise<CloudResult<T>> {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, items: [], error: "Supabase nao configurado." };

  const user = await getCurrentUser();
  if (!user) return { authenticated: false, ok: false, items: [] };
  await flushCloudOutbox(user.id);

  const cached = itemsCache.get(table);
  if (!options.force && cached && cached.userId === user.id && cached.expiresAt > Date.now()) {
    return {
      authenticated: true,
      ok: true,
      items: applyCloudOutbox(user.id, table, cached.items as T[]),
    };
  }

  const pending = itemsRequests.get(table);
  if (pending) return pending as Promise<CloudResult<T>>;

  const query = supabase
    .from(table)
    .select("id,title,data,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const request: Promise<CloudResult<unknown>> = withTimeout(Promise.resolve(query), 10_000).then((result) => {
    itemsRequests.delete(table);
    if (!result) return { authenticated: true, ok: false, items: [], error: "Tempo limite ao carregar dados." };
    const { data, error } = result;
    if (error) return { authenticated: true, ok: false, items: [], error: error.message };
    const cloudItems = ((data || []) as CloudRow<{ id: string }>[]).map((row) => row.data);
    const items = applyCloudOutbox(user.id, table, cloudItems);
    itemsCache.set(table, { userId: user.id, items, expiresAt: Date.now() + 15_000 });
    return { authenticated: true, ok: true, items };
  }).catch((error: unknown) => {
    itemsRequests.delete(table);
    return {
      authenticated: true,
      ok: false,
      items: [],
      error: error instanceof Error ? error.message : "Falha ao carregar dados.",
    };
  });
  itemsRequests.set(table, request);
  return request as Promise<CloudResult<T>>;
}

export function invalidateCloudItems(table?: CloudTable) {
  if (table) {
    itemsCache.delete(table);
    itemsRequests.delete(table);
    return;
  }
  itemsCache.clear();
  itemsRequests.clear();
}

export async function upsertCloudItem<T extends { id: string }>(
  table: CloudTable,
  item: T,
  title?: string,
): Promise<CloudWriteResult> {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, error: "Supabase nao configurado." };

  const user = await getCurrentUser();
  if (!user) return { authenticated: false, ok: false, error: "Usuario nao autenticado." };

  const queued = enqueueCloudOperation(user.id, { table, type: "upsert", id: item.id, item, title });
  if (!queued) {
    return {
      authenticated: true,
      ok: false,
      queued: false,
      error: "Nao foi possivel preservar a alteracao para envio.",
    };
  }
  await flushCloudOutbox(user.id);
  const pending = readCloudOutbox(user.id).some((operation) => operation.key === `${table}:${item.id}`);
  return {
    authenticated: true,
    ok: !pending,
    queued: pending,
    error: pending ? "Alteracao aguardando sincronizacao." : undefined,
  };
}

export async function replaceCloudItems<T extends { id: string }>(
  table: CloudTable,
  items: T[],
  titleForItem: (item: T) => string,
  options: { deleteMissing?: boolean } = {},
): Promise<CloudWriteResult> {
  if (options.deleteMissing) {
    return { authenticated: true, ok: false, error: "Substituicao destrutiva de colecao bloqueada." };
  }
  if (!items.length) {
    const user = await getCurrentUser();
    return user
      ? { authenticated: true, ok: true }
      : { authenticated: false, ok: false, error: "Usuario nao autenticado." };
  }
  const user = await getCurrentUser();
  if (!user) return { authenticated: false, ok: false, error: "Usuario nao autenticado." };
  const queuedResults = items.map((item) => enqueueCloudOperation(user.id, {
    table,
    type: "upsert",
    id: item.id,
    item,
    title: titleForItem(item),
  }));
  const queued = queuedResults.every(Boolean);
  if (!queued) {
    return { authenticated: true, ok: false, queued: false, error: "Nao foi possivel preservar todos os itens para envio." };
  }
  await flushCloudOutbox(user.id);
  const pendingKeys = new Set(readCloudOutbox(user.id).map((operation) => operation.key));
  const pending = items.some((item) => pendingKeys.has(`${table}:${item.id}`));
  return {
    authenticated: true,
    ok: !pending,
    queued: pending,
    error: pending ? "Itens aguardando sincronizacao." : undefined,
  };
}

export async function deleteCloudItem(table: CloudTable, id: string): Promise<CloudWriteResult> {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, error: "Supabase nao configurado." };

  const user = await getCurrentUser();
  if (!user) return { authenticated: false, ok: false, error: "Usuario nao autenticado." };

  const queued = enqueueCloudOperation(user.id, { table, type: "delete", id });
  if (!queued) {
    return {
      authenticated: true,
      ok: false,
      queued: false,
      error: "Nao foi possivel preservar a exclusao para envio.",
    };
  }
  await flushCloudOutbox(user.id);
  const pending = readCloudOutbox(user.id).some((operation) => operation.key === `${table}:${id}`);
  return {
    authenticated: true,
    ok: !pending,
    queued: pending,
    error: pending ? "Exclusao aguardando sincronizacao." : undefined,
  };
}

export async function flushPendingCloudOperations() {
  const user = await getCurrentUser();
  if (!user) return false;
  return flushCloudOutbox(user.id);
}

async function flushCloudOutbox(userId: string) {
  const existing = flushRequests.get(userId);
  if (existing) return existing;
  const request = runCloudOutbox(userId).finally(() => flushRequests.delete(userId));
  flushRequests.set(userId, request);
  return request;
}

async function runCloudOutbox(userId: string) {
  const supabase = createClient();
  if (!supabase) return false;
  const operations = readCloudOutbox(userId);
  if (!operations.length) return true;

  const results = await Promise.all(operations.map(async (operation) => {
    try {
      const request = operation.type === "delete"
        ? supabase.from(operation.table).delete().eq("id", operation.id).eq("user_id", userId)
        : supabase.from(operation.table).upsert({
            id: operation.id,
            user_id: userId,
            title: operation.title || "Sem titulo",
            ...(operation.table === "projects" ? {} : { project_id: projectIdFor(operation.item) }),
            data: operation.item,
            updated_at: new Date().toISOString(),
          }, { onConflict: "id,user_id" });
      const result = await withTimeout(Promise.resolve(request), 8_000);
      if (!result || result.error) return null;
      return operation;
    } catch {
      return null;
    }
  }));
  const completedOperations = results.filter((operation) => operation !== null);
  completedOperations.forEach((operation) => itemsCache.delete(operation.table));
  acknowledgeCloudOperations(userId, completedOperations);
  return readCloudOutbox(userId).length === 0;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
