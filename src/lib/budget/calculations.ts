import type { BudgetLine, BudgetSectionKey, BudgetState, BudgetTotals } from "./types";
import {
  calculateCompleteBudget,
  calculateLineTotal,
  calculateSectionTotal,
} from "../budgetCalculations";

export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function lineTotal(line: BudgetLine) {
  return calculateLineTotal(line);
}

export function sectionTotal(lines: BudgetLine[]) {
  return calculateSectionTotal(lines);
}

export function calculateBudget(budget: BudgetState): BudgetTotals {
  return calculateCompleteBudget(budget);
}

export function getBudgetStatus(budget: BudgetState, totals: BudgetTotals) {
  const messages: { tone: "success" | "warning" | "danger"; message: string }[] = [];

  if (budget.settings.profitPercent < 20) {
    messages.push({ tone: "danger", message: "Margem baixa. Considere reajustar o valor." });
  } else if (budget.settings.profitPercent <= 35) {
    messages.push({ tone: "success", message: "Orçamento saudável." });
  } else {
    messages.push({ tone: "success", message: "Boa margem comercial." });
  }

  if (totals.startingPrice > 0 && totals.thirdPartyCosts / totals.startingPrice > 0.45) {
    messages.push({
      tone: "warning",
      message: "Custos de terceiros estão pesando no orçamento.",
    });
  }

  return messages;
}

export const sectionKeys: BudgetSectionKey[] = [
  "preProduction",
  "southProduction",
  "freelanceProduction",
  "equipment",
  "postProduction",
  "postFreelancers",
  "teamCosts",
  "travelCosts",
];
