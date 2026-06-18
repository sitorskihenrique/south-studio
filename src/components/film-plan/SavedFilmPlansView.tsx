"use client";

import { CalendarDays, CheckCircle2, Copy, Film, FolderOpen, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { TextInput } from "@/components/budget/BudgetFields";
import type { SavedFilmPlan } from "@/lib/film-plan/types";

export function SavedFilmPlansView({
  plans,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  plans: SavedFilmPlan[];
  onOpen: (plan: SavedFilmPlan) => void;
  onDuplicate: (plan: SavedFilmPlan) => void;
  onDelete: (plan: SavedFilmPlan) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return plans.filter((plan) => !term || plan.projectName.toLocaleLowerCase("pt-BR").includes(term) || plan.client.toLocaleLowerCase("pt-BR").includes(term));
  }, [plans, search]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={Film} label="Planos salvos" value={String(plans.length)} />
        <Metric icon={CalendarDays} label="Total de takes" value={String(plans.reduce((sum, plan) => sum + plan.takeCount, 0))} />
        <Metric icon={CheckCircle2} label="Takes concluídos" value={String(plans.reduce((sum, plan) => sum + plan.completedCount, 0))} />
      </div>
      <div className="relative rounded-3xl border border-zinc-200 bg-white p-4">
        <Search size={17} className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-zinc-400" />
        <TextInput aria-label="Buscar planos" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por projeto ou cliente" className="pl-10" />
      </div>
      {filtered.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((plan) => {
            const progress = plan.takeCount ? Math.round((plan.completedCount / plan.takeCount) * 100) : 0;
            return (
              <article key={plan.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-950/5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0"><span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">{progress}% concluído</span><h2 className="mt-4 truncate text-xl font-semibold tracking-tight text-zinc-950">{plan.projectName}</h2><p className="mt-1 truncate text-sm text-zinc-500">{plan.client}</p></div>
                  <div className="shrink-0 sm:text-right"><p className="text-xs text-zinc-400">{formatDate(plan.date)}</p><p className="mt-2 text-sm font-semibold text-zinc-700">{plan.takeCount} takes</p></div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${progress}%` }} /></div>
                <p className="mt-3 text-xs text-zinc-400">Atualizado em {formatDateTime(plan.updatedAt)}</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-3"><Action icon={FolderOpen} label="Abrir" onClick={() => onOpen(plan)} primary /><Action icon={Copy} label="Duplicar" onClick={() => onDuplicate(plan)} /><Action icon={Trash2} label="Excluir" onClick={() => onDelete(plan)} danger /></div>
              </article>
            );
          })}
        </div>
      ) : <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center"><div><Film size={30} className="mx-auto text-zinc-400" /><p className="mt-4 font-semibold text-zinc-700">Nenhum plano encontrado</p><p className="mt-2 text-sm text-zinc-500">Crie e salve seu primeiro plano de filmagem.</p></div></div>}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Film; label: string; value: string }) {
  return <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"><Icon size={19} className="text-violet-600" /><p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs font-medium text-zinc-500">{label}</p></div>;
}

function Action({ icon: Icon, label, onClick, primary, danger }: { icon: typeof FolderOpen; label: string; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition ${primary ? "bg-zinc-950 text-white hover:bg-zinc-800" : danger ? "border border-zinc-200 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700" : "border border-zinc-200 text-zinc-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"}`}><Icon size={15} />{label}</button>;
}

function formatDate(value: string) {
  if (!value) return "Data não definida";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`));
}
function formatDateTime(value: string) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
}
