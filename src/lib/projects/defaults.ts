import type { ProjectDraft, ProjectPreProduction } from "./types";

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
