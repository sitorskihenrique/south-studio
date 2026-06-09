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
    projectId: "",
    projectName: "Orçamento exemplo",
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
        line("pre-guide", "Exemplo: planejamento", 0, 0, "Adicione roteiro, pesquisa e demais itens de pré-produção."),
      ],
      southProduction: [
        line("south-guide", "Exemplo: hora da equipe interna", 0, 0, "Informe valor por hora e quantidade de horas."),
      ],
      freelanceProduction: [
        line("free-guide", "Exemplo: profissional freelancer", 0, 0, "Adicione função, diária ou valor fechado."),
      ],
      equipment: [
        line("eq-guide", "Exemplo: equipamento ou locação", 0, 0, "Inclua câmera, luz, áudio e outros recursos."),
      ],
      postProduction: [
        line("post-guide", "Exemplo: edição e finalização", 0, 0, "Informe valor por hora e horas estimadas."),
      ],
      postFreelancers: [
        line("post-free-guide", "Exemplo: freelancer de pós-produção", 0, 0, "Adicione editor, colorista, motion ou designer."),
      ],
      teamCosts: [
        line("team-guide", "Exemplo: custo operacional", 0, 0, "Inclua alimentação, combustível e hospedagem."),
      ],
      travelCosts: [
        line("travel-guide", "Exemplo: deslocamento", 0, 0, "Inclua passagens, transporte e extras."),
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
