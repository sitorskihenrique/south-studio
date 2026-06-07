"use client";

import { AlertTriangle, CheckCircle2, CircleDollarSign, Landmark, WalletCards } from "lucide-react";
import { formatCurrency, getBudgetStatus } from "@/lib/budget/calculations";
import { BudgetState, BudgetTotals } from "@/lib/budget/types";

export function BudgetSummary({ budget, totals }: { budget: BudgetState; totals: BudgetTotals }) {
  const status = getBudgetStatus(budget, totals);
  const budgetUsage =
    budget.client.budget > 0 ? Math.min((totals.finalValue / budget.client.budget) * 100, 100) : 0;

  return (
    <aside className="order-1 space-y-4 xl:order-2 xl:sticky xl:top-6">
      <div className="overflow-hidden rounded-3xl bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-950/15">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500 text-white">
            <CircleDollarSign size={21} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-zinc-400">
              Resumo do orçamento
            </p>
            <p className="mt-1 text-sm text-zinc-300">{totals.totalItems} itens calculados</p>
          </div>
        </div>

        <div className="mt-7">
          <p className="text-sm text-zinc-400">Valor final</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
            {formatCurrency(totals.finalValue)}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-white/10 pt-5">
          <Metric label="Preço de partida" value={formatCurrency(totals.startingPrice)} />
          <Metric label="Reserva" value={formatCurrency(totals.emergencyReserve)} />
          <Metric label="Lucro" value={formatCurrency(totals.profit)} />
          <Metric label="Impostos" value={formatCurrency(totals.tax)} />
          <Metric label="Entrada" value={formatCurrency(totals.entryValue)} />
          <Metric label="Receita líquida" value={formatCurrency(totals.revenueNet)} />
        </div>

        {budget.client.budget > 0 && (
          <div className="mt-6 rounded-2xl bg-white/7 p-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-400">Budget utilizado</span>
              <span className="font-semibold">{Math.round(budgetUsage)}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${budgetUsage}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-zinc-800">Status inteligente</p>
        <div className="mt-4 space-y-3">
          {status.map((item) => (
            <div
              key={item.message}
              className={`flex items-start gap-3 rounded-2xl p-3 text-sm ${
                item.tone === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : item.tone === "danger"
                    ? "bg-red-50 text-red-800"
                    : "bg-amber-50 text-amber-900"
              }`}
            >
              {item.tone === "success" ? (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              )}
              {item.message}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <WalletCards size={18} className="text-violet-600" />
          <p className="text-sm font-semibold text-zinc-800">Pagamento</p>
        </div>
        <div className="mt-4 divide-y divide-zinc-100">
          <PriceLine label={`Entrada (${budget.settings.entryPercent}%)`} value={totals.entryValue} />
          <PriceLine label="Saldo restante" value={totals.remainingValue} />
          <PriceLine label="2x com taxa" value={totals.installment2Value} />
          <PriceLine label="4x com taxa" value={totals.installment4Value} />
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Landmark size={18} className="text-violet-600" />
          <p className="text-sm font-semibold text-zinc-800">Margem comercial</p>
        </div>
        <p className="mt-4 text-3xl font-semibold tabular-nums text-zinc-950">
          {budget.settings.profitPercent}%
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Lucro estimado de {formatCurrency(totals.finalProfit)}
        </p>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}

function PriceLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold tabular-nums text-zinc-800">{formatCurrency(value)}</span>
    </div>
  );
}
