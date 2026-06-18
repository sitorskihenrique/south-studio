"use client";

import { createClient } from "./client";
import type { User } from "@supabase/supabase-js";

export type CloudTable = "budgets" | "film_plans" | "tasks" | "projects";

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

function projectIdFor(item: unknown) {
  if (!item || typeof item !== "object" || !("projectId" in item)) return null;
  const projectId = (item as { projectId?: unknown }).projectId;
  return typeof projectId === "string" && projectId ? projectId : null;
}

let userCache: { user: User | null; expiresAt: number } | null = null;
let userRequest: Promise<User | null> | null = null;
const itemsCache = new Map<CloudTable, { userId: string; items: unknown[]; expiresAt: number }>();
const itemsRequests = new Map<CloudTable, Promise<CloudResult<unknown>>>();

export function setCloudAuthUser(user: User | null) {
  if (userCache?.user?.id !== user?.id) {
    itemsCache.clear();
    itemsRequests.clear();
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
  });
  return userRequest;
}

export async function readCloudItems<T>(table: CloudTable): Promise<CloudResult<T>> {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, items: [], error: "Supabase não configurado." };

  const user = await getCurrentUser();
  if (!user) return { authenticated: false, ok: false, items: [] };

  const cached = itemsCache.get(table);
  if (cached && cached.userId === user.id && cached.expiresAt > Date.now()) {
    return { authenticated: true, ok: true, items: cached.items as T[] };
  }

  const pending = itemsRequests.get(table);
  if (pending) return pending as Promise<CloudResult<T>>;

  const query = supabase
    .from(table)
    .select("id,title,data,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const request: Promise<CloudResult<unknown>> = Promise.resolve(query).then(({ data, error }) => {
      itemsRequests.delete(table);
      if (error) return { authenticated: true, ok: false, items: [], error: error.message };
      const items = ((data || []) as CloudRow<unknown>[]).map((row) => row.data);
      itemsCache.set(table, { userId: user.id, items, expiresAt: Date.now() + 15_000 });
      return { authenticated: true, ok: true, items };
    });
  itemsRequests.set(table, request);
  return request as Promise<CloudResult<T>>;
}

export async function upsertCloudItem<T extends { id: string }>(table: CloudTable, item: T, title?: string) {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, error: "Supabase não configurado." };

  const user = await getCurrentUser();
  if (!user) return { authenticated: false, ok: false, error: "Usuário não autenticado." };

  const { error } = await supabase.from(table).upsert({
    id: item.id,
    user_id: user.id,
    title: title || "Sem título",
    ...(table === "projects" ? {} : { project_id: projectIdFor(item) }),
    data: item,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id,user_id" });

  if (!error) itemsCache.delete(table);
  return { authenticated: true, ok: !error, error: error?.message };
}

export async function replaceCloudItems<T extends { id: string }>(
  table: CloudTable,
  items: T[],
  titleForItem: (item: T) => string,
  options: { deleteMissing?: boolean } = {},
) {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, error: "Supabase não configurado." };

  const user = await getCurrentUser();
  if (!user) return { authenticated: false, ok: false, error: "Usuário não autenticado." };

  const rows = items.map((item) => ({
    id: item.id,
    user_id: user.id,
    title: titleForItem(item),
    ...(table === "projects" ? {} : { project_id: projectIdFor(item) }),
    data: item,
    updated_at: new Date().toISOString(),
  }));

  if (options.deleteMissing) {
    const { data: existing, error: existingError } = await supabase.from(table).select("id").eq("user_id", user.id);
    if (existingError) return { authenticated: true, ok: false, error: existingError.message };
    const currentIds = new Set(rows.map((row) => row.id));
    const missingIds = (existing || []).map((row) => row.id as string).filter((id) => !currentIds.has(id));
    if (missingIds.length) {
      const { error: deleteError } = await supabase.from(table).delete().eq("user_id", user.id).in("id", missingIds);
      if (deleteError) return { authenticated: true, ok: false, error: deleteError.message };
    }
  }

  if (!rows.length) {
    itemsCache.delete(table);
    return { authenticated: true, ok: true };
  }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id,user_id" });
  if (!error) itemsCache.delete(table);
  return { authenticated: true, ok: !error, error: error?.message };
}

export async function deleteCloudItem(table: CloudTable, id: string) {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, error: "Supabase não configurado." };

  const user = await getCurrentUser();
  if (!user) return { authenticated: false, ok: false, error: "Usuário não autenticado." };

  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", user.id);
  if (!error) itemsCache.delete(table);
  return { authenticated: true, ok: !error, error: error?.message };
}
