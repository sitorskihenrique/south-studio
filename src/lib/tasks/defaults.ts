import type { StudioTask, TaskDraft } from "./types";

export const emptyTaskDraft: TaskDraft = {
  title: "",
  category: "Produção",
  priority: "Média",
  estimatedTime: "30min",
  customMinutes: 45,
  status: "A fazer",
  day: "Segunda",
  notes: "",
};

export const defaultTasks: StudioTask[] = [
  {
    id: "tarefa-inicial-1",
    title: "Revisar roteiro da próxima gravação",
    category: "Produção",
    priority: "Alta",
    estimatedTime: "1h",
    customMinutes: 60,
    status: "A fazer",
    day: "Segunda",
    notes: "Confirmar versões e observações do diretor.",
    createdAt: "2026-06-07T09:00:00.000Z",
  },
  {
    id: "tarefa-inicial-2",
    title: "Confirmar locação e horário de call",
    category: "Produção",
    priority: "Urgente",
    estimatedTime: "30min",
    customMinutes: 30,
    status: "Em progresso",
    day: "Terça",
    notes: "",
    createdAt: "2026-06-07T09:05:00.000Z",
  },
  {
    id: "tarefa-inicial-3",
    title: "Organizar arquivos do último projeto",
    category: "Pós-produção",
    priority: "Baixa",
    estimatedTime: "2h",
    customMinutes: 120,
    status: "Concluída",
    day: "Sexta",
    notes: "Separar selects e backups.",
    createdAt: "2026-06-07T09:10:00.000Z",
  },
];
