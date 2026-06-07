"use client";

import { CalendarDays, CheckCircle2, Clock3, Film, Layers3 } from "lucide-react";
import type { FilmPlan } from "@/lib/film-plan/types";

export function FilmPlanSummary({ plan }: { plan: FilmPlan }) {
  const takes = plan.days.flatMap((day) => day.sequences.flatMap((sequence) => sequence.takes));
  const completed = takes.filter((take) => take.status === "Concluído").length;
  const minutes = takes.reduce((sum, take) => sum + take.estimatedMinutes, 0);
  const progress = takes.length ? Math.round((completed / takes.length) * 100) : 0;
  return (
    <aside className="order-1 space-y-4 xl:order-2 xl:sticky xl:top-6">
      <div className="rounded-3xl bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-950/15">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Plano ativo</p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">{plan.projectName || "Projeto sem nome"}</h2>
        <p className="mt-2 text-sm text-zinc-400">{plan.client || "Cliente não informado"}</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{ width: `${progress}%` }} /></div>
        <p className="mt-2 text-xs text-zinc-400">{progress}% dos takes concluídos</p>
        <div className="mt-5 divide-y divide-white/10 border-t border-white/10">
          <Row icon={CalendarDays} label="Diárias" value={String(plan.days.length)} />
          <Row icon={Layers3} label="Sequências" value={String(plan.days.reduce((sum, day) => sum + day.sequences.length, 0))} />
          <Row icon={Film} label="Takes" value={String(takes.length)} />
          <Row icon={CheckCircle2} label="Concluídos" value={String(completed)} />
          <Row icon={Clock3} label="Tempo estimado" value={`${minutes} min`} />
        </div>
      </div>
      <div className="rounded-3xl border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-zinc-800">Entrega</p>
        <p className="mt-4 text-sm text-zinc-600">{plan.duration || "Duração a definir"}</p>
        <p className="mt-2 text-sm font-medium text-violet-700">{plan.formats || "Formatos a definir"}</p>
        <p className="mt-4 text-xs leading-5 text-zinc-400">{plan.weather || "Meteorologia a definir"}</p>
      </div>
    </aside>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Film; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 py-3"><span className="flex items-center gap-2 text-xs text-zinc-400"><Icon size={15} className="text-violet-300" />{label}</span><span className="text-sm font-semibold">{value}</span></div>;
}
