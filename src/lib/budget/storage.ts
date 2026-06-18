import type { BudgetState, SavedBudget } from "./types";
import { readScopedStorage, writeScopedStorage } from "@/lib/storage/scope";

export const draftStorageKey = "south-studio-budget-calculator-v4";
export const savedBudgetsStorageKey = "south-studio-saved-budgets-v1";

export function readLocalStorage<T>(key: string, fallback: T): T {
  return readScopedStorage(key, fallback);
}

export function writeLocalStorage(key: string, value: unknown) {
  return writeScopedStorage(key, value);
}

export function createSavedBudget(budget: BudgetState, summary: SavedBudget["summary"]): SavedBudget {
  const now = new Date().toISOString();
  return {
    id: budget.id,
    projectId: budget.projectId || "",
    projectName: budget.projectName.trim() || "Orçamento sem nome",
    clientName: budget.client.company.trim() || "Cliente não informado",
    createdAt: budget.createdAt || now,
    updatedAt: now,
    status: budget.status,
    finalValue: summary.finalValue,
    profitPercent: budget.settings.profitPercent,
    budget: { ...budget, createdAt: budget.createdAt || now, updatedAt: now },
    summary,
  };
}

export function upsertSavedBudget(items: SavedBudget[], item: SavedBudget) {
  const exists = items.some((budget) => budget.id === item.id);
  return exists
    ? items.map((budget) => (budget.id === item.id ? item : budget))
    : [item, ...items];
}
