import { defaultTasks } from "./defaults";
import { taskCategories, taskDays, taskPriorities, taskStatuses, taskTimeOptions, type StudioTask, type TaskCategory } from "./types";

export const tasksStorageKey = "south-studio-tasks-v1";
export const tasksUpdatedEvent = "south-studio-tasks-updated";

export function readTasks(): StudioTask[] {
  try {
    const stored = window.localStorage.getItem(tasksStorageKey);
    return stored ? normalizeTasks(JSON.parse(stored)) : defaultTasks;
  } catch {
    return defaultTasks;
  }
}

export function writeTasks(tasks: StudioTask[]) {
  try {
    window.localStorage.setItem(tasksStorageKey, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent(tasksUpdatedEvent));
    return true;
  } catch {
    return false;
  }
}

export function normalizeTasks(value: unknown): StudioTask[] {
  if (!Array.isArray(value)) return defaultTasks;
  const tasks = value
    .map((task, index) => normalizeTask(task, index))
    .filter((task) => !["tarefa-inicial-1", "tarefa-inicial-2", "tarefa-inicial-3"].includes(task.id));
  return tasks.length ? tasks : defaultTasks;
}

export function normalizeTask(value: unknown, index = 0): StudioTask {
  const task = value && typeof value === "object" ? value as Partial<StudioTask> & { category?: string } : {};
  return {
    id: typeof task.id === "string" && task.id ? task.id : `tarefa-importada-${index}`,
    title: typeof task.title === "string" ? task.title : "Tarefa sem título",
    description: typeof task.description === "string" ? task.description : "",
    category: normalizeCategory(task.category),
    priority: taskPriorities.includes(task.priority as StudioTask["priority"]) ? task.priority as StudioTask["priority"] : "Média",
    estimatedTime: taskTimeOptions.includes(task.estimatedTime as StudioTask["estimatedTime"]) ? task.estimatedTime as StudioTask["estimatedTime"] : "30min",
    customMinutes: typeof task.customMinutes === "number" ? Math.max(1, task.customMinutes) : 30,
    status: taskStatuses.includes(task.status as StudioTask["status"]) ? task.status as StudioTask["status"] : "A fazer",
    day: taskDays.includes(task.day as StudioTask["day"]) ? task.day as StudioTask["day"] : "Segunda",
    specificDate: typeof task.specificDate === "string" ? task.specificDate : "",
    notes: typeof task.notes === "string" ? task.notes : "",
    createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString(),
  };
}

function normalizeCategory(category?: string): TaskCategory {
  if (taskCategories.includes(category as TaskCategory)) return category as TaskCategory;
  if (category === "Pessoal") return "Pessoal";
  if (category === "Financeiro") return "Financeiro";
  if (category === "Estudo") return "Estudos";
  if (category === "Outro") return "Outros";
  if (category === "Produção" || category === "Pós-produção" || category === "Comercial") return "Trabalho";
  return "Outros";
}
