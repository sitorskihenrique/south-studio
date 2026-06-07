"use client";

import { BadgeDollarSign, Building2, CalendarClock, CreditCard, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/budget/calculations";
import { BudgetState, BudgetTotals } from "@/lib/budget/types";
import { BudgetSection, Field, NumberInput } from "./BudgetFields";

export function FinancialFlow({
  budget,
  totals,
  updateSetting,
}: {
  budget: BudgetState;
  totals: BudgetTotals;
  updateSetting: (key: keyof BudgetState["settings"], value: number) => void;
}) {
  return (
    <BudgetSection
      eyebrow="Fechamento"
      title="Formação do Valor Final"
      description="A mesma cadeia de cálculo da planilha, apresentada com clareza."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FlowCard label="Preço de partida" value={totals.startingPrice} icon={BadgeDollarSign} />
        <PercentCard
          label="Reserva de emergência"
          percent={budget.settings.emergencyPercent}
          value={totals.emergencyReserve}
          onChange={(value) => updateSetting("emergencyPercent", value)}
        />
        <FlowCard label="Parcial + reserva" value={totals.partialWithReserve} icon={TrendingUp} />
        <PercentCard
          label="Margem de lucro"
          percent={budget.settings.profitPercent}
          value={totals.profit}
          onChange={(value) => updateSetting("profitPercent", value)}
        />
        <FlowCard label="Parcial + lucro" value={totals.partialWithProfit} icon={TrendingUp} />
        <PercentCard
          label="Imposto"
          percent={budget.settings.taxPercent}
          value={totals.tax}
          onChange={(value) => updateSetting("taxPercent", value)}
        />
      </div>
      <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl bg-violet-600 p-5 text-white sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200">Valor final</p>
          <p className="mt-1 text-sm text-violet-100">Parcial com lucro + impostos</p>
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatCurrency(totals.finalValue)}</p>
      </div>
    </BudgetSection>
  );
}

export function ProvisionAndPayment({
  budget,
  totals,
  updateSetting,
}: {
  budget: BudgetState;
  totals: BudgetTotals;
  updateSetting: (key: keyof BudgetState["settings"], value: number) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <BudgetSection eyebrow="Prazo" title="Provisionamento">
        <Field label="Taxa de provisionamento">
          <NumberInput
            value={budget.settings.provisionPercent}
            step="0.01"
            suffix="%"
            onValueChange={(value) => updateSetting("provisionPercent", value)}
          />
        </Field>
        <div className="mt-5 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-4">
          <PriceLine label="15 dias" value={totals.provision15} />
          <PriceLine label="30 dias" value={totals.provision30} />
          <PriceLine label="60 dias" value={totals.provision60} />
        </div>
      </BudgetSection>

      <BudgetSection eyebrow="Condições" title="Pagamento">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Porcentagem de entrada">
            <NumberInput
              value={budget.settings.entryPercent}
              step="1"
              suffix="%"
              onValueChange={(value) => updateSetting("entryPercent", value)}
            />
          </Field>
          <Field label="Taxa de parcelamento">
            <NumberInput
              value={budget.settings.installmentRatePercent}
              step="0.01"
              suffix="%"
              onValueChange={(value) => updateSetting("installmentRatePercent", value)}
            />
          </Field>
          <Field label="Quantidade de parcelas">
            <NumberInput
              value={budget.settings.installments}
              step="1"
              suffix="x"
              onValueChange={(value) => updateSetting("installments", Math.max(1, value))}
            />
          </Field>
        </div>
        <div className="mt-5 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-4">
          <PriceLine label="Entrada" value={totals.entryValue} />
          <PriceLine
            label={`${budget.settings.installments}x personalizadas de ${formatCurrency(totals.customInstallmentValue)}`}
            value={totals.customInstallmentTotal}
          />
          <PriceLine label={`2x de ${formatCurrency(totals.installment2Value)}`} value={totals.installment2Total} />
          <PriceLine label={`4x de ${formatCurrency(totals.installment4Value)}`} value={totals.installment4Total} />
        </div>
      </BudgetSection>
    </div>
  );
}

export function DrePanel({ budget, totals }: { budget: BudgetState; totals: BudgetTotals }) {
  const positive = totals.finalProfit >= 0;

  return (
    <BudgetSection
      eyebrow="Visão gerencial"
      title="DRE Resumido"
      description="Leitura simplificada da saúde financeira do orçamento."
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <DreLine label="Faturamento bruto" value={totals.finalValue} strong />
          <DreLine label="(-) Impostos" value={-totals.tax} />
          <DreLine label="Receita líquida" value={totals.revenueNet} strong />
          <DreLine label="(-) Custos variáveis" value={-totals.variableCosts} />
          <DreLine label="Lucro bruto" value={totals.grossProfit} strong />
          <DreLine label="(-) Despesas fixas" value={-totals.fixedExpenses} />
          <DreLine label="Resultado operacional" value={totals.operatingResult} strong />
          <DreLine label="(-) Reserva" value={-totals.emergencyReserve} />
          <DreLine label="Lucro final estimado" value={totals.finalProfit} strong tone={positive ? "green" : "red"} />
        </div>
        <div className={`rounded-2xl p-5 ${positive ? "bg-emerald-50" : "bg-red-50"}`}>
          <Building2 size={20} className={positive ? "text-emerald-700" : "text-red-700"} />
          <p className="mt-5 text-sm font-medium text-zinc-600">Resultado estimado</p>
          <p className={`mt-2 text-3xl font-semibold tabular-nums ${positive ? "text-emerald-800" : "text-red-800"}`}>
            {formatCurrency(totals.finalProfit)}
          </p>
          <p className="mt-5 text-xs leading-5 text-zinc-500">
            Margem comercial configurada em {budget.settings.profitPercent}%.
          </p>
        </div>
      </div>
    </BudgetSection>
  );
}

function FlowCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof CreditCard;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <Icon size={18} className="text-violet-600" />
      <p className="mt-4 text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">{formatCurrency(value)}</p>
    </div>
  );
}

function PercentCard({
  label,
  percent,
  value,
  onChange,
}: {
  label: string;
  percent: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <div className="w-24">
          <NumberInput value={percent} step="1" suffix="%" onValueChange={onChange} />
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold tabular-nums text-zinc-900">{formatCurrency(value)}</p>
    </div>
  );
}

function PriceLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold tabular-nums text-zinc-900">{formatCurrency(value)}</span>
    </div>
  );
}

function DreLine({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: number;
  strong?: boolean;
  tone?: "green" | "red";
}) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 ${strong ? "bg-zinc-50" : "bg-white"}`}>
      <span className={`text-sm ${strong ? "font-semibold text-zinc-800" : "text-zinc-500"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${strong ? "font-semibold" : "font-medium"} ${tone === "green" ? "text-emerald-700" : tone === "red" ? "text-red-700" : "text-zinc-800"}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
