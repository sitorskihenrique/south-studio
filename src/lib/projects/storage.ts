import { exampleProject } from "./defaults";
import { projectPriorities, projectStatuses, type StudioProject } from "./types";

export const projectsStorageKey = "south-studio-projects-v1";

export function readProjects(): StudioProject[] {
  try {
    const stored = window.localStorage.getItem(projectsStorageKey);
    return stored ? normalizeProjects(JSON.parse(stored)) : [exampleProject];
  } catch {
    return [exampleProject];
  }
}

export function writeProjects(projects: StudioProject[]) {
  try {
    window.localStorage.setItem(projectsStorageKey, JSON.stringify(projects));
    return true;
  } catch {
    return false;
  }
}

export function normalizeProjects(value: unknown): StudioProject[] {
  if (!Array.isArray(value)) return [exampleProject];
  return value.map((item, index) => normalizeProject(item, index));
}

function normalizeProject(value: unknown, index: number): StudioProject {
  const project = value && typeof value === "object" ? value as Partial<StudioProject> : {};
  const now = new Date().toISOString();
  return {
    id: project.id || `projeto-importado-${index}`,
    title: project.title || "Projeto sem nome",
    client: project.client || "",
    status: projectStatuses.includes(project.status as StudioProject["status"]) ? project.status as StudioProject["status"] : "Ideia",
    priority: projectPriorities.includes(project.priority as StudioProject["priority"]) ? project.priority as StudioProject["priority"] : "Média",
    deadline: project.deadline || "",
    description: project.description || "",
    tags: Array.isArray(project.tags) ? project.tags.filter((tag): tag is string => typeof tag === "string") : [],
    progress: typeof project.progress === "number" ? project.progress : 5,
    preProduction: { ...exampleProject.preProduction, ...project.preProduction },
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
