import type { FilmPlan, SavedFilmPlan } from "./types";
import { readScopedStorage, writeScopedStorage } from "@/lib/storage/scope";

export const filmPlanDraftKey = "south-studio-film-plan-draft-v1";
export const savedFilmPlansKey = "south-studio-saved-film-plans-v1";

export function readFilmPlanStorage<T>(key: string, fallback: T): T {
  return readScopedStorage(key, fallback);
}

export function writeFilmPlanStorage(key: string, value: unknown) {
  return writeScopedStorage(key, value);
}

export function toSavedFilmPlan(plan: FilmPlan): SavedFilmPlan {
  const now = new Date().toISOString();
  const normalized = { ...plan, createdAt: plan.createdAt || now, updatedAt: now };
  const takes = normalized.days.flatMap((day) => day.sequences.flatMap((sequence) => sequence.takes));
  return {
    id: normalized.id,
    projectId: normalized.projectId || "",
    projectName: normalized.projectName.trim() || "Plano sem nome",
    client: normalized.client.trim() || "Cliente não informado",
    date: normalized.date,
    takeCount: takes.length,
    completedCount: takes.filter((take) => take.status === "Concluído").length,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
    plan: normalized,
  };
}

export function upsertFilmPlan(items: SavedFilmPlan[], item: SavedFilmPlan) {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items];
}
