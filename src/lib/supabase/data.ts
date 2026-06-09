"use client";

import { createClient } from "./client";

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

export async function getCurrentUser() {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function readCloudItems<T>(table: CloudTable): Promise<CloudResult<T>> {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, items: [], error: "Supabase não configurado." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { authenticated: false, ok: false, items: [] };

  const { data, error } = await supabase
    .from(table)
    .select("id,title,data,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return { authenticated: true, ok: false, items: [], error: error.message };
  return { authenticated: true, ok: true, items: ((data || []) as CloudRow<T>[]).map((row) => row.data) };
}

export async function upsertCloudItem<T extends { id: string }>(table: CloudTable, item: T, title?: string) {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, error: "Supabase não configurado." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { authenticated: false, ok: false, error: "Usuário não autenticado." };

  const { error } = await supabase.from(table).upsert({
    id: item.id,
    user_id: user.id,
    title: title || "Sem título",
    data: item,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id,user_id" });

  return { authenticated: true, ok: !error, error: error?.message };
}

export async function replaceCloudItems<T extends { id: string }>(table: CloudTable, items: T[], titleForItem: (item: T) => string) {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, error: "Supabase não configurado." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { authenticated: false, ok: false, error: "Usuário não autenticado." };

  const rows = items.map((item) => ({
    id: item.id,
    user_id: user.id,
    title: titleForItem(item),
    data: item,
    updated_at: new Date().toISOString(),
  }));

  if (!rows.length) return { authenticated: true, ok: true };
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id,user_id" });
  return { authenticated: true, ok: !error, error: error?.message };
}

export async function deleteCloudItem(table: CloudTable, id: string) {
  const supabase = createClient();
  if (!supabase) return { authenticated: false, ok: false, error: "Supabase não configurado." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { authenticated: false, ok: false, error: "Usuário não autenticado." };

  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", user.id);
  return { authenticated: true, ok: !error, error: error?.message };
}
