import type { StudioTask, TaskDraft } from "./types";

export const emptyTaskDraft: TaskDraft = {
  projectId: "",
  title: "",
  description: "",
  category: "Trabalho",
  priority: "Média",
  estimatedTime: "30min",
  customMinutes: 45,
  status: "A fazer",
  day: "Segunda",
  specificDate: "",
  notes: "",
};

export const defaultTasks: StudioTask[] = [];
