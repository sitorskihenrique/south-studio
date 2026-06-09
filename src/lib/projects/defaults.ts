import type { ProjectDraft, ProjectPreProduction, StudioProject } from "./types";

export const emptyPreProduction: ProjectPreProduction = {
  centralIdea: "",
  objective: "",
  audience: "",
  mainMessage: "",
  visualReferences: "",
  creativeNotes: "",
  deliverables: "",
  pendingItems: "",
};

export const emptyProjectDraft: ProjectDraft = {
  title: "",
  client: "",
  status: "Ideia",
  priority: "Média",
  deadline: "",
  description: "",
  tags: [],
  progress: 5,
  preProduction: { ...emptyPreProduction },
};

export const exampleProject: StudioProject = {
  id: "projeto-exemplo",
  title: "Projeto exemplo",
  client: "Cliente exemplo",
  status: "Pré-produção",
  priority: "Média",
  deadline: "",
  description: "Use este projeto como guia para centralizar planejamento, tarefas, orçamento e plano de filmagem.",
  tags: ["Guia", "Exemplo"],
  progress: 20,
  preProduction: {
    centralIdea: "Descreva a ideia central da produção em poucas linhas.",
    objective: "Defina o resultado que o projeto precisa alcançar.",
    audience: "Registre para quem a produção está sendo criada.",
    mainMessage: "Resuma a mensagem principal.",
    visualReferences: "Cole links ou descreva referências visuais.",
    creativeNotes: "Anote decisões criativas importantes.",
    deliverables: "Liste os formatos e entregáveis previstos.",
    pendingItems: "Registre as próximas decisões da pré-produção.",
  },
  createdAt: "2026-06-09T12:00:00.000Z",
  updatedAt: "2026-06-09T12:00:00.000Z",
  related: { taskIds: [], budgetIds: [], filmPlanIds: [] },
};
