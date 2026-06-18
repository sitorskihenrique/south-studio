import { emptyPreProduction } from "./defaults";
import { readScopedStorage, writeScopedStorage } from "@/lib/storage/scope";
import { projectPriorities, projectStatuses, type StudioProject } from "./types";

export const projectsStorageKey = "south-studio-projects-v1";

export function readProjects(): StudioProject[] {
  return normalizeProjects(readScopedStorage<unknown>(projectsStorageKey, []));
}

export function writeProjects(projects: StudioProject[]) {
  return writeScopedStorage(projectsStorageKey, projects);
}

export function normalizeProjects(value: unknown): StudioProject[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => normalizeProject(item, index));
}

export function normalizeProject(value: unknown, index = 0): StudioProject {
  const project = value && typeof value === "object" ? value as Partial<StudioProject> : {};
  const now = new Date().toISOString();
  return {
    id: typeof project.id === "string" && project.id ? project.id : `projeto-importado-${index}`,
    title: typeof project.title === "string" && project.title.trim() ? project.title : "Projeto sem nome",
    client: typeof project.client === "string" ? project.client : "",
    status: projectStatuses.includes(project.status as StudioProject["status"]) ? project.status as StudioProject["status"] : "Ideia",
    priority: projectPriorities.includes(project.priority as StudioProject["priority"]) ? project.priority as StudioProject["priority"] : "Média",
    deadline: typeof project.deadline === "string" ? project.deadline : "",
    description: typeof project.description === "string" ? project.description : "",
    tags: Array.isArray(project.tags) ? project.tags.filter((tag): tag is string => typeof tag === "string") : [],
    progress: typeof project.progress === "number" && Number.isFinite(project.progress) ? Math.min(100, Math.max(0, project.progress)) : 5,
    preProduction: { ...emptyPreProduction, ...project.preProduction },
    createdAt: project.createdAt || now,
    updatedAt: project.updatedAt || now,
    related: {
      taskIds: project.related?.taskIds || [],
      budgetIds: project.related?.budgetIds || [],
      filmPlanIds: project.related?.filmPlanIds || [],
    },
  };
}

export function progressForStatus(status: StudioProject["status"], current = 5) {
  return { Ideia: 5, "Pré-produção": 20, Produção: 50, "Pós-produção": 75, "Em espera": current, Entregue: 100 }[status];
}
