export type BudgetLine = {
  id: string;
  item: string;
  description: string;
  unitValue: number;
  quantity: number;
  complexity: number;
};

export type BudgetStatus =
  | "Rascunho"
  | "Enviado"
  | "Em análise"
  | "Aprovado"
  | "Reprovado"
  | "Arquivado";

export type BudgetSectionKey =
  | "preProduction"
  | "southProduction"
  | "freelanceProduction"
  | "equipment"
  | "postProduction"
  | "postFreelancers"
  | "teamCosts"
  | "travelCosts";

export type ClientData = {
  company: string;
  document: string;
  responsible: string;
  email: string;
  contact: string;
  budget: number;
};

export type BriefingData = {
  location: string;
  budgetDate: string;
  productionDays: number;
  productionDate: string;
  deliveryDate: string;
  paymentForecast: string;
  logline: string;
  deliverables: string;
  responsibles: string;
};

export type BudgetSettings = {
  emergencyPercent: number;
  profitPercent: number;
  taxPercent: number;
  provisionPercent: number;
  entryPercent: number;
  installments: number;
  installmentRatePercent: number;
};

export type BudgetState = {
  id: string;
  projectId: string;
  projectName: string;
  status: BudgetStatus;
  createdAt: string;
  client: ClientData;
  briefing: BriefingData;
  sections: Record<BudgetSectionKey, BudgetLine[]>;
  settings: BudgetSettings;
  updatedAt: string;
};

export type SavedBudget = {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
  status: BudgetStatus;
  finalValue: number;
  profitPercent: number;
  budget: BudgetState;
  summary: BudgetTotals;
};

export type SectionTotals = Record<BudgetSectionKey, number>;

export type BudgetTotals = {
  sections: SectionTotals;
  startingPrice: number;
  emergencyReserve: number;
  partialWithReserve: number;
  profit: number;
  partialWithProfit: number;
  tax: number;
  finalValue: number;
  provision15: number;
  provision30: number;
  provision60: number;
  entryValue: number;
  remainingValue: number;
  installment2Total: number;
  installment2Value: number;
  installment4Total: number;
  installment4Value: number;
  customInstallmentTotal: number;
  customInstallmentValue: number;
  thirdPartyCosts: number;
  revenueNet: number;
  variableCosts: number;
  grossProfit: number;
  fixedExpenses: number;
  operatingResult: number;
  finalProfit: number;
  totalItems: number;
};
