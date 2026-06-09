export type TakeStatus = "Pendente" | "Gravando" | "Concluído" | "Cancelado";
export type TakePriority = "Essencial" | "Importante" | "Extra";

export type VisualReference = {
  id: string;
  name: string;
  dataUrl: string;
};

export type ShotItem = {
  id: string;
  label: string;
  completed: boolean;
};

export type Take = {
  id: string;
  title: string;
  time: string;
  location: string;
  environment: string;
  estimatedMinutes: number;
  cast: string;
  look: string;
  description: string;
  artAndText: string;
  equipment: string;
  status: TakeStatus;
  priority: TakePriority;
  shotlist: ShotItem[];
  images: VisualReference[];
};

export type Sequence = {
  id: string;
  title: string;
  notes: string;
  takes: Take[];
};

export type FilmDay = {
  id: string;
  label: string;
  date: string;
  schedule: {
    preparation: string;
    cameraOpen: string;
    lunch: string;
    lunchReturn: string;
    wrapStart: string;
    dayEnd: string;
  };
  sequences: Sequence[];
};

export type ScriptBlock = {
  id: string;
  logline: string;
  script: string;
  cta: string;
};

export type EquipmentChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
  custom: boolean;
};

export type FilmPlan = {
  id: string;
  projectId: string;
  projectName: string;
  client: string;
  agency: string;
  duration: string;
  formats: string;
  weather: string;
  date: string;
  director: string;
  producer: string;
  simpleLocation: string;
  simpleNotes: string;
  equipmentChecklist: EquipmentChecklistItem[];
  scripts: ScriptBlock[];
  days: FilmDay[];
  activeDayId: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedFilmPlan = {
  id: string;
  projectId: string;
  projectName: string;
  client: string;
  date: string;
  takeCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
  plan: FilmPlan;
};
