export const projectStatuses = ["Ideia", "Pré-produção", "Produção", "Pós-produção", "Em espera", "Entregue"] as const;
export const projectPriorities = ["Baixa", "Média", "Alta"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectPriority = (typeof projectPriorities)[number];

export type ProjectPreProduction = {
  centralIdea: string;
  objective: string;
  audience: string;
  mainMessage: string;
  visualReferences: string;
  creativeNotes: string;
  deliverables: string;
  pendingItems: string;
};

export type StudioProject = {
  id: string;
  title: string;
  client: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: string;
  description: string;
  tags: string[];
  progress: number;
  preProduction: ProjectPreProduction;
  createdAt: string;
  updatedAt: string;
  // Futuro: projectId será usado em tasks, budgets e film_plans para vínculos diretos.
  related: {
    taskIds: string[];
    budgetIds: string[];
    filmPlanIds: string[];
  };
};

export type ProjectDraft = Omit<StudioProject, "id" | "createdAt" | "updatedAt" | "related">;
export type ProjectDetailTab = "Visão geral" | "Pré-produção" | "Tarefas" | "Orçamentos" | "Planos de Filmagem" | "Arquivos/Referências";
