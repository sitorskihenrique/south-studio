"use client";

import { Clock3, Film, MapPin } from "lucide-react";
import type { FilmDay } from "@/lib/film-plan/types";

export function TimelineView({ day }: { day: FilmDay }) {
  const takes = day.sequences.flatMap((sequence) => sequence.takes.map((take) => ({ ...take, sequence: sequence.title }))).sort((a, b) => a.time.localeCompare(b.time));
  return (
    <div className="studio-card rounded-[28px] p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Timeline</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{day.label}</h2></div>
        <p className="text-sm text-zinc-500">{takes.length} takes · {takes.reduce((sum, take) => sum + take.estimatedMinutes, 0)} minutos estimados</p>
      </div>
      <div className="mt-7 space-y-1">
        {takes.map((take) => (
          <div key={take.id} className="grid gap-2 border-l-2 border-zinc-300 py-3 pl-4 sm:grid-cols-[80px_1fr_150px] sm:items-center sm:gap-3 sm:pl-5">
            <p className="flex items-center gap-2 text-sm font-semibold tabular-nums text-zinc-800"><Clock3 size={15} />{take.time}</p>
            <div><p className="font-semibold text-zinc-800">{take.title}</p><p className="mt-1 flex items-center gap-2 text-xs text-zinc-400"><Film size={13} />{take.sequence}<span>·</span><MapPin size={13} />{take.location || "Local a definir"}</p></div>
            <div className="flex items-center justify-between gap-3 sm:justify-end"><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">{take.estimatedMinutes} min</span><span className="text-xs font-semibold text-zinc-500">{take.status}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
