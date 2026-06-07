import type { BudgetLine, BudgetSectionKey, BudgetState } from "./types";

function line(
  id: string,
  item: string,
  unitValue = 0,
  quantity = 0,
  description = "",
  complexity = 100,
): BudgetLine {
  return { id, item, description, unitValue, quantity, complexity };
}

export const sectionMeta: Record<
  BudgetSectionKey,
  { eyebrow: string; title: string; description: string; usesComplexity: boolean; quantityLabel: string }
> = {
  preProduction: {
    eyebrow: "Planejamento",
    title: "Pré-produção",
    description: "Calculada por valor unitário, quantidade e complexidade.",
    usesComplexity: true,
    quantityLabel: "Qtd.",
  },
  southProduction: {
    eyebrow: "Equipe interna",
    title: "Produção South",
    description: "Use horas internas da equipe South e ajuste a complexidade.",
    usesComplexity: true,
    quantityLabel: "Horas",
  },
  freelanceProduction: {
    eyebrow: "Terceiros",
    title: "Produção Freelas",
    description: "Use valores fechados ou diárias de profissionais externos.",
    usesComplexity: false,
    quantityLabel: "Qtd.",
  },
  equipment: {
    eyebrow: "Estrutura",
    title: "Equipamentos",
    description: "Some equipamentos próprios, locações e custos técnicos.",
    usesComplexity: false,
    quantityLabel: "Qtd.",
  },
  postProduction: {
    eyebrow: "Finalização",
    title: "Pós-produção",
    description: "Calculada por horas de edição, finalização e revisão.",
    usesComplexity: true,
    quantityLabel: "Horas",
  },
  postFreelancers: {
    eyebrow: "Terceiros",
    title: "Freelancers — Pós-produção",
    description: "Use valores de especialistas externos contratados na finalização.",
    usesComplexity: true,
    quantityLabel: "Qtd.",
  },
  teamCosts: {
    eyebrow: "Operação",
    title: "Custo da Equipe Geral",
    description: "Inclui deslocamento, alimentação, hospedagem e logística.",
    usesComplexity: false,
    quantityLabel: "Qtd.",
  },
  travelCosts: {
    eyebrow: "Deslocamento",
    title: "Locomoção da Equipe",
    description: "Inclui viagens e despesas de deslocamento de freelancers.",
    usesComplexity: false,
    quantityLabel: "Qtd.",
  },
};

export function createEmptyLine(item = "Novo item"): BudgetLine {
  return line(crypto.randomUUID(), item);
}

export function createDefaultBudget(id = "novo-orcamento"): BudgetState {
  return {
    id,
    projectName: "Novo orçamento audiovisual",
    status: "Rascunho",
    createdAt: "",
    client: {
      company: "",
      document: "",
      responsible: "",
      email: "",
      contact: "",
      budget: 0,
    },
    briefing: {
      location: "",
      budgetDate: "",
      productionDays: 1,
      productionDate: "",
      deliveryDate: "",
      paymentForecast: "",
      logline: "",
      deliverables: "",
      responsibles: "",
    },
    sections: {
      preProduction: [
        line("pre-script", "Roteiro + Ordem do dia", 180, 1),
        line("pre-research", "Pesquisa e Tech Scout", 150, 1),
      ],
      southProduction: [
        line("south-director", "Diretor de Cena / Produtor", 180, 8),
        line("south-photo", "Dir. Fotografia / Fotógrafo", 180, 8),
        line("south-camera", "Op. Câmera", 150, 8),
        line("south-extra", "Extra", 200, 0),
      ],
      freelanceProduction: [
        line("free-director", "Diretor de Cena / Produtor", 650, 0),
        line("free-photo", "Dir. Fotografia / Fotógrafo", 650, 0),
        line("free-camera", "Op. Câmera", 650, 0),
        line("free-mobile", "Op. Câmera Mobile / Making Off", 450, 0),
        line("free-assistant", "Assistente", 350, 0),
        line("free-makeup", "Maquiadora", 450, 0),
        line("free-location", "Locação / Estúdio / Airbnb", 800, 0),
        line("free-casting", "Casting Principal", 700, 0),
        line("free-extra", "Extra / Custo do operador", 250, 0),
      ],
      equipment: [
        line("eq-camera", "Câmera", 350, 1, "Considerando uma diária de 8 horas"),
        line("eq-lens", "Lente", 180, 1),
        line("eq-light", "Luz", 250, 1),
        line("eq-movement", "Movimento", 150, 1),
        line("eq-drone", "Drone", 450, 0),
        line("eq-rental", "Locação de equipamentos", 0, 0),
        line("eq-car", "Uso do carro e seguro", 180, 1),
      ],
      postProduction: [
        line("post-edit", "Montagem e Finalização", 180, 12),
        line("post-color", "Color Grading / DaVinci", 180, 2),
        line("post-captions", "Legendagem e Revisão", 140, 2),
        line("post-lettering", "Animação de Letterings", 200, 4),
        line("post-voice", "Locuções", 250, 0),
        line("post-photo", "Edição das fotos", 150, 0),
        line("post-extra", "Extras", 150, 0),
      ],
      postFreelancers: [
        line("post-free-editor", "Editor Freelancer", 250, 0, "Contabilizado por vídeos finalizados"),
        line("post-free-designer", "Designer Gráfico", 300, 0),
        line("post-free-motion", "Motion Designer + Ilustração", 400, 0),
      ],
      teamCosts: [
        line("team-fuel", "Combustível (km)", 1.2, 0),
        line("team-travel-time", "Tempo de deslocamento", 60, 0, "Considerando R$60/hora"),
        line("team-toll", "Pedágio", 30, 0),
        line("team-coffee", "Alimentação / Café", 30, 0),
        line("team-meal", "Alimentação / Almoço / Jantar", 45, 0),
        line("team-hotel", "Hospedagem", 320, 0),
        line("team-parking", "Estacionamento", 25, 0),
      ],
      travelCosts: [
        line("travel-uber", "Uber", 50, 0),
        line("travel-ticket", "Passagem aérea / ônibus", 400, 0),
        line("travel-coffee", "Alimentação / Café", 30, 0),
        line("travel-meal", "Alimentação / Almoço / Jantar", 45, 0),
        line("travel-fuel", "Combustível", 150, 0),
        line("travel-extra", "Extras", 50, 0),
      ],
    },
    settings: {
      emergencyPercent: 3,
      profitPercent: 30,
      taxPercent: 9,
      provisionPercent: 1.59,
      entryPercent: 20,
      installments: 2,
      installmentRatePercent: 1.59,
    },
    updatedAt: "",
  };
}
