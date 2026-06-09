import type { StudioTask, TaskDraft } from "./types";

export const emptyTaskDraft: TaskDraft = {
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

export const defaultTasks: StudioTask[] = [
  {
    id: "tarefa-guia",
    title: "Exemplo: crie sua primeira tarefa",
    description: "Use este card como guia. Edite o título, escolha um dia, categoria, prioridade e data específica.",
    category: "Trabalho",
    priority: "Média",
    estimatedTime: "30min",
    customMinutes: 30,
    status: "A fazer",
    day: "Segunda",
    specificDate: "",
    notes: "Você pode concluir, editar, duplicar, mover ou excluir esta tarefa.",
    createdAt: "2026-06-07T09:00:00.000Z",
  },
];
