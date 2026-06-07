import type { FilmDay, FilmPlan, ScriptBlock, Sequence, ShotItem, Take } from "./types";

const defaultShots = ["Plano aberto", "Plano médio", "Plano movimento", "Plano detalhe", "Plano fechado"];

export function createShot(label: string): ShotItem {
  return { id: crypto.randomUUID(), label, completed: false };
}

export function createTake(title = "Novo take", time = "09:00"): Take {
  return {
    id: crypto.randomUUID(),
    title,
    time,
    location: "",
    environment: "",
    estimatedMinutes: 20,
    cast: "",
    look: "",
    description: "",
    artAndText: "",
    equipment: "",
    status: "Pendente",
    priority: "Importante",
    shotlist: defaultShots.map(createShot),
    images: [],
  };
}

export function createSequence(title = "Sequência 01"): Sequence {
  return {
    id: crypto.randomUUID(),
    title,
    notes: "",
    takes: [createTake("Take 01", "09:00")],
  };
}

export function createFilmDay(label = "Diária 01"): FilmDay {
  const sequence = createSequence();
  return {
    id: crypto.randomUUID(),
    label,
    date: "",
    schedule: {
      preparation: "08:00",
      cameraOpen: "09:00",
      lunch: "12:00",
      lunchReturn: "13:00",
      wrapStart: "17:30",
      dayEnd: "18:00",
    },
    sequences: [sequence],
  };
}

export function createScriptBlock(): ScriptBlock {
  return { id: crypto.randomUUID(), logline: "", script: "", cta: "" };
}

export function createDefaultFilmPlan(id = "novo-plano"): FilmPlan {
  const day = id === "novo-plano" ? createInitialFilmDay() : createFilmDay();
  return {
    id,
    projectName: "Novo Plano de Filmagem",
    client: "",
    agency: "",
    duration: "120”",
    formats: "16:9 · 9:16",
    weather: "Parcialmente nublado · 24°C",
    date: "",
    director: "",
    producer: "",
    scripts: id === "novo-plano"
      ? [createInitialScriptBlock("novo-plano-roteiro-1"), createInitialScriptBlock("novo-plano-roteiro-2")]
      : [createScriptBlock(), createScriptBlock()],
    days: [day],
    activeDayId: day.id,
    createdAt: "",
    updatedAt: "",
  };
}

function createInitialScriptBlock(id: string): ScriptBlock {
  return { id, logline: "", script: "", cta: "" };
}

function createInitialFilmDay(): FilmDay {
  const take: Take = {
    id: "novo-plano-take-1",
    title: "Take 01",
    time: "09:00",
    location: "",
    environment: "",
    estimatedMinutes: 20,
    cast: "",
    look: "",
    description: "",
    artAndText: "",
    equipment: "",
    status: "Pendente",
    priority: "Importante",
    shotlist: defaultShots.map((label, index) => ({
      id: `novo-plano-shot-${index + 1}`,
      label,
      completed: false,
    })),
    images: [],
  };

  return {
    id: "novo-plano-diaria-1",
    label: "Diária 01",
    date: "",
    schedule: {
      preparation: "08:00",
      cameraOpen: "09:00",
      lunch: "12:00",
      lunchReturn: "13:00",
      wrapStart: "17:30",
      dayEnd: "18:00",
    },
    sequences: [{
      id: "novo-plano-sequencia-1",
      title: "Sequência 01",
      notes: "",
      takes: [take],
    }],
  };
}
