"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  FolderOpen,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/budget/calculations";
import type { BudgetStatus, SavedBudget } from "@/lib/budget/types";
import { SelectInput, TextInput } from "./BudgetFields";

export const budgetStatuses: BudgetStatus[] = [
  "Rascunho",
  "Enviado",
  "Em análise",
  "Aprovado",
  "Reprovado",
  "Arquivado",
];

export function SavedBudgetsView({
  budgets,
  onOpen,
  onDuplicate,
  onDelete,
  onStatusChange,
}: {
  budgets: SavedBudget[];
  onOpen: (budget: SavedBudget) => void;
  onDuplicate: (budget: SavedBudget) => void;
  onDelete: (budget: SavedBudget) => void;
  onStatusChange: (budget: SavedBudget, status: BudgetStatus) => void;
}) {
  const [filter, setFilter] = useState<BudgetStatus | "Todos">("Todos");
  const [search, setSearch] = useState("");

  const filteredBudgets = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return budgets.filter((budget) => {
      const matchesFilter = filter === "Todos" || budget.status === filter;
      const matchesSearch =
        !normalizedSearch ||
        budget.projectName.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        budget.clientName.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [budgets, filter, search]);

  const approved = budgets.filter((budget) => budget.status === "Aprovado");
  const considered = budgets.filter((budget) => budget.status !== "Arquivado");
  const openValue = budgets
    .filter((budget) => !["Aprovado", "Reprovado", "Arquivado"].includes(budget.status))
    .reduce((sum, budget) => sum + budget.finalValue, 0);
  const approvalRate = considered.length ? (approved.length / considered.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Total de orçamentos" value={String(budgets.length)} />
        <StatCard icon={Clock3} label="Valor total em aberto" value={formatCurrency(openValue)} />
        <StatCard icon={CheckCircle2} label="Aprovados" value={String(approved.length)} />
        <StatCard icon={TrendingUp} label="Taxa de aprovação" value={`${approvalRate.toFixed(0)}%`} />
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <TextInput
            aria-label="Buscar orçamentos"
            placeholder="Buscar por projeto ou cliente"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="sm:w-48">
          <SelectInput
            aria-label="Filtrar por status"
            value={filter}
            onChange={(event) => setFilter(event.target.value as BudgetStatus | "Todos")}
          >
            <option>Todos</option>
            {budgetStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </SelectInput>
        </div>
      </div>

      {filteredBudgets.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredBudgets.map((budget) => (
            <article
              key={budget.id}
              className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-950/5"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <StatusBadge status={budget.status} />
                  <h2 className="mt-4 truncate text-xl font-semibold tracking-tight text-zinc-950">
                    {budget.projectName}
                  </h2>
                  <p className="mt-1 truncate text-sm text-zinc-500">{budget.clientName}</p>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="text-xs font-medium text-zinc-400">Valor final</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950">
                    {formatCurrency(budget.finalValue)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">Margem {budget.profitPercent}%</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50 p-4 text-xs">
                <DateInfo label="Criado em" value={budget.createdAt} />
                <DateInfo label="Última alteração" value={budget.updatedAt} />
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium text-zinc-500">Status</label>
                <SelectInput
                  aria-label={`Status de ${budget.projectName}`}
                  value={budget.status}
                  onChange={(event) => onStatusChange(budget, event.target.value as BudgetStatus)}
                  className="mt-2"
                >
                  {budgetStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </SelectInput>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <CardAction icon={FolderOpen} label="Abrir" onClick={() => onOpen(budget)} primary />
                <CardAction icon={Copy} label="Duplicar" onClick={() => onDuplicate(budget)} />
                <CardAction icon={Trash2} label="Excluir" onClick={() => onDelete(budget)} danger />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center">
          <div>
            <Archive size={28} className="mx-auto text-zinc-400" />
            <p className="mt-4 text-base font-semibold text-zinc-700">Nenhum orçamento encontrado</p>
            <p className="mt-2 text-sm text-zinc-500">
              Salve um orçamento ou ajuste os filtros da busca.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BudgetStatus }) {
  const tones: Record<BudgetStatus, string> = {
    Rascunho: "bg-zinc-100 text-zinc-700",
    Enviado: "bg-sky-50 text-sky-700",
    "Em análise": "bg-amber-50 text-amber-800",
    Aprovado: "bg-emerald-50 text-emerald-700",
    Reprovado: "bg-red-50 text-red-700",
    Arquivado: "bg-violet-50 text-violet-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status]}`}>
      {status}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <Icon size={19} className="text-violet-600" />
      <p className="mt-5 text-2xl font-semibold tracking-tight tabular-nums text-zinc-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-zinc-500">{label}</p>
    </div>
  );
}

function DateInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-400">{label}</p>
      <p className="mt-1 font-medium text-zinc-700">{formatDate(value)}</p>
    </div>
  );
}

function CardAction({
  icon: Icon,
  label,
  onClick,
  primary,
  danger,
}: {
  icon: typeof FolderOpen;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition ${
        primary
          ? "bg-zinc-950 text-white hover:bg-zinc-800"
          : danger
            ? "border border-zinc-200 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            : "border border-zinc-200 text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
