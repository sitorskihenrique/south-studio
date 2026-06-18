"use client";

import type { SavedBudget } from "@/lib/budget/types";
import { savedBudgetsStorageKey } from "@/lib/budget/storage";
import type { SavedFilmPlan } from "@/lib/film-plan/types";
import { savedFilmPlansKey } from "@/lib/film-plan/storage";
import type { StudioProject } from "@/lib/projects/types";
import { projectsStorageKey } from "@/lib/projects/storage";
import type { StudioTask } from "@/lib/tasks/types";
import { tasksStorageKey } from "@/lib/tasks/storage";
import { readScopedStorage } from "@/lib/storage/scope";
import { readCloudItems, replaceCloudItems } from "./data";

const migrationKey = "cologne-os-cloud-migration-v1";

export async function migrateLocalCollectionsOnce(userId: string) {
  if (typeof window === "undefined") return;
  const marker = `${migrationKey}:${userId}`;
  if (window.localStorage.getItem(marker) === "done") return;

  const [projects, tasks, budgets, plans] = await Promise.all([
    readCloudItems<StudioProject>("projects", { force: true }),
    readCloudItems<StudioTask>("tasks", { force: true }),
    readCloudItems<SavedBudget>("budgets", { force: true }),
    readCloudItems<SavedFilmPlan>("film_plans", { force: true }),
  ]);

  if (![projects, tasks, budgets, plans].every((result) => result.authenticated && result.ok)) return;

  const operations: Promise<unknown>[] = [];
  const localProjects = readScopedStorage<StudioProject[]>(projectsStorageKey, []);
  const localTasks = readScopedStorage<StudioTask[]>(tasksStorageKey, []);
  const localBudgets = readScopedStorage<SavedBudget[]>(savedBudgetsStorageKey, []);
  const localPlans = readScopedStorage<SavedFilmPlan[]>(savedFilmPlansKey, []);

  if (!projects.items.length && localProjects.length) {
    operations.push(replaceCloudItems("projects", localProjects, (item) => item.title || "Projeto"));
  }
  if (!tasks.items.length && localTasks.length) {
    operations.push(replaceCloudItems("tasks", localTasks, (item) => item.title || "Tarefa"));
  }
  if (!budgets.items.length && localBudgets.length) {
    operations.push(replaceCloudItems("budgets", localBudgets, (item) => item.projectName || "Orçamento"));
  }
  if (!plans.items.length && localPlans.length) {
    operations.push(replaceCloudItems("film_plans", localPlans, (item) => item.projectName || "Plano de filmagem"));
  }

  await Promise.all(operations);
  window.localStorage.setItem(marker, "done");
}

export async function importMissingLocalCollections() {
  if (typeof window === "undefined") return { authenticated: false, ok: false };

  const [projects, tasks, budgets, plans] = await Promise.all([
    readCloudItems<StudioProject>("projects", { force: true }),
    readCloudItems<StudioTask>("tasks", { force: true }),
    readCloudItems<SavedBudget>("budgets", { force: true }),
    readCloudItems<SavedFilmPlan>("film_plans", { force: true }),
  ]);

  if (![projects, tasks, budgets, plans].every((result) => result.authenticated && result.ok)) {
    return { authenticated: false, ok: false };
  }

  const missingProjects = onlyMissing(
    readScopedStorage<StudioProject[]>(projectsStorageKey, []),
    projects.items,
  );
  const missingTasks = onlyMissing(
    readScopedStorage<StudioTask[]>(tasksStorageKey, []),
    tasks.items,
  );
  const missingBudgets = onlyMissing(
    readScopedStorage<SavedBudget[]>(savedBudgetsStorageKey, []),
    budgets.items,
  );
  const missingPlans = onlyMissing(
    readScopedStorage<SavedFilmPlan[]>(savedFilmPlansKey, []),
    plans.items,
  );

  const results = await Promise.all([
    replaceCloudItems("projects", missingProjects, (item) => item.title || "Projeto"),
    replaceCloudItems("tasks", missingTasks, (item) => item.title || "Tarefa"),
    replaceCloudItems("budgets", missingBudgets, (item) => item.projectName || "Orçamento"),
    replaceCloudItems("film_plans", missingPlans, (item) => item.projectName || "Plano de filmagem"),
  ]);

  return {
    authenticated: true,
    ok: results.every((result) => result.authenticated && result.ok),
    imported: missingProjects.length + missingTasks.length + missingBudgets.length + missingPlans.length,
  };
}

function onlyMissing<T extends { id: string }>(localItems: T[], cloudItems: T[]) {
  const cloudIds = new Set(cloudItems.map((item) => item.id));
  return localItems.filter((item) => item.id && !cloudIds.has(item.id));
}
