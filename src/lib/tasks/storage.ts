import { defaultTasks } from "./defaults";
import type { StudioTask } from "./types";

export const tasksStorageKey = "south-studio-tasks-v1";
export const tasksUpdatedEvent = "south-studio-tasks-updated";

export function readTasks(): StudioTask[] {
  try {
    const stored = window.localStorage.getItem(tasksStorageKey);
    return stored ? (JSON.parse(stored) as StudioTask[]) : defaultTasks;
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
