export const taskDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;
export const taskCategories = ["Trabalho", "Pessoal", "Rotina", "Estudos", "Financeiro", "Outros"] as const;
export const taskPriorities = ["Baixa", "Média", "Alta", "Urgente"] as const;
export const taskStatuses = ["A fazer", "Em progresso", "Concluída"] as const;
export const taskTimeOptions = ["15min", "30min", "1h", "2h", "4h", "Personalizado"] as const;

export type TaskDay = (typeof taskDays)[number];
export type TaskCategory = (typeof taskCategories)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskTime = (typeof taskTimeOptions)[number];
export type TaskDayFilter = "Visão da Semana" | "Hoje" | "Calendário" | "Concluídas" | TaskDay;
export type TaskStatusFilter = "Todos" | TaskStatus;
export type TaskCategoryFilter = "Todas" | TaskCategory;

export interface StudioTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedTime: TaskTime;
  customMinutes: number;
  status: TaskStatus;
  day: TaskDay;
  specificDate: string;
  notes: string;
  createdAt: string;
}

export type TaskDraft = Omit<StudioTask, "id" | "createdAt">;
