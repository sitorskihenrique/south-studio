import type {
  BudgetLine,
  BudgetSectionKey,
  BudgetState,
  BudgetTotals,
  SectionTotals,
} from "./budget/types";

export function safeNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function calculateLineTotal(line: BudgetLine) {
  return (
    safeNumber(line.unitValue) *
    safeNumber(line.quantity) *
    (safeNumber(line.complexity) / 100)
  );
}

export function calculateSectionTotal(lines: BudgetLine[]) {
  return lines.reduce((total, line) => total + calculateLineTotal(line), 0);
}

export function calculateBasePrice(sections: SectionTotals) {
  return Object.values(sections).reduce((total, value) => total + safeNumber(value), 0);
}

export function calculateEmergencyReserve(basePrice: number, percent: number) {
  return safeNumber(basePrice) * (safeNumber(percent) / 100);
}

export function calculateProfit(subtotalWithReserve: number, percent: number) {
  return safeNumber(subtotalWithReserve) * (safeNumber(percent) / 100);
}

export function calculateTaxes(subtotalWithProfit: number, percent: number) {
  return safeNumber(subtotalWithProfit) * (safeNumber(percent) / 100);
}

export function calculateFinalPrice(subtotalWithProfit: number, taxes: number) {
  return safeNumber(subtotalWithProfit) + safeNumber(taxes);
}

export function calculatePayment(
  finalValue: number,
  entryPercent: number,
  installments: number,
  installmentRatePercent: number,
) {
  const entryValue = safeNumber(finalValue) * (safeNumber(entryPercent) / 100);
  const remainingValue = Math.max(0, safeNumber(finalValue) - entryValue);
  const installmentCount = Math.max(1, Math.round(safeNumber(installments) || 1));
  const feeValue = remainingValue * (safeNumber(installmentRatePercent) / 100);
  const installmentTotal = remainingValue + feeValue;

  return {
    entryValue,
    remainingValue,
    installmentTotal,
    installmentValue: installmentTotal / installmentCount,
  };
}

export function calculateDRE(
  finalValue: number,
  taxes: number,
  sections: SectionTotals,
  reserve: number,
) {
  const thirdPartyCosts =
    sections.freelanceProduction + sections.postFreelancers + sections.travelCosts;
  const variableCosts = thirdPartyCosts + sections.teamCosts;
  const fixedExpenses =
    sections.preProduction +
    sections.southProduction +
    sections.equipment +
    sections.postProduction;
  const revenueNet = finalValue - taxes;
  const grossProfit = revenueNet - variableCosts;
  const operatingResult = grossProfit - fixedExpenses;

  return {
    thirdPartyCosts,
    variableCosts,
    fixedExpenses,
    revenueNet,
    grossProfit,
    operatingResult,
    finalProfit: operatingResult - reserve,
  };
}

export function calculateCompleteBudget(budget: BudgetState): BudgetTotals {
  const sections = Object.fromEntries(
    Object.entries(budget.sections).map(([key, lines]) => [
      key,
      calculateSectionTotal(lines),
    ]),
  ) as Record<BudgetSectionKey, number>;

  const startingPrice = calculateBasePrice(sections);
  const emergencyReserve = calculateEmergencyReserve(
    startingPrice,
    budget.settings.emergencyPercent,
  );
  const partialWithReserve = startingPrice + emergencyReserve;
  const profit = calculateProfit(partialWithReserve, budget.settings.profitPercent);
  const partialWithProfit = partialWithReserve + profit;
  const tax = calculateTaxes(partialWithProfit, budget.settings.taxPercent);
  const finalValue = calculateFinalPrice(partialWithProfit, tax);
  const provision = safeNumber(budget.settings.provisionPercent) / 100;
  const customPayment = calculatePayment(
    finalValue,
    budget.settings.entryPercent,
    budget.settings.installments,
    budget.settings.installmentRatePercent,
  );
  const payment2 = calculatePayment(
    finalValue,
    budget.settings.entryPercent,
    2,
    budget.settings.installmentRatePercent,
  );
  const payment4 = calculatePayment(
    finalValue,
    budget.settings.entryPercent,
    4,
    budget.settings.installmentRatePercent,
  );
  const dre = calculateDRE(finalValue, tax, sections, emergencyReserve);

  return {
    sections,
    startingPrice,
    emergencyReserve,
    partialWithReserve,
    profit,
    partialWithProfit,
    tax,
    finalValue,
    provision15: finalValue * (1 + provision),
    provision30: finalValue * (1 + provision * 2),
    provision60: finalValue * (1 + provision * 4),
    entryValue: customPayment.entryValue,
    remainingValue: customPayment.remainingValue,
    installment2Total: payment2.installmentTotal,
    installment2Value: payment2.installmentValue,
    installment4Total: payment4.installmentTotal,
    installment4Value: payment4.installmentValue,
    customInstallmentTotal: customPayment.installmentTotal,
    customInstallmentValue: customPayment.installmentValue,
    ...dre,
    totalItems: Object.values(budget.sections).reduce((sum, lines) => sum + lines.length, 0),
  };
}

