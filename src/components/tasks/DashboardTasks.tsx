"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckSquare2, Clock3 } from "lucide-react";
import { defaultTasks } from "@/lib/tasks/defaults";
import { formatMinutes, getEstimatedMinutes, getTodayTaskDay } from "@/lib/tasks/filters";
import { normalizeTasks, readTasks, tasksUpdatedEvent } from "@/lib/tasks/storage";
import { taskDays, type StudioTask } from "@/lib/tasks/types";
import { readCloudItems } from "@/lib/supabase/data";

export function DashboardTasks() {
  const [tasks, setTasks] = useState<StudioTask[]>(defaultTasks);

  useEffect(() => {
    const sync = () => {
      setTasks(readTasks());
      readCloudItems<StudioTask>("tasks").then((result) => {
        if (result.authenticated && result.ok && result.items.length) setTasks(normalizeTasks(result.items));
      });
    };
    sync();
    window.addEventListener(tasksUpdatedEvent, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(tasksUpdatedEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const today = getTodayTaskDay();
  const pending = tasks.filter((task) => task.status !== "Concluída");
  const todayTasks = pending.filter((task) => task.day === today);
  const upcoming = useMemo(() => {
    const todayIndex = taskDays.indexOf(today);
    return pending
      .filter((task) => task.day !== today)
      .sort((a, b) => ((taskDays.indexOf(a.day) - todayIndex + 7) % 7) - ((taskDays.indexOf(b.day) - todayIndex + 7) % 7))
      .slice(0, 3);
  }, [pending, today]);

  return (
    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="studio-card rounded-[28px] p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase text-zinc-500">Hoje · {today}</p><h2 className="mt-2 text-xl font-semibold text-zinc-950">Tarefas de hoje</h2></div>
          <span className="grid h-11 min-w-11 place-items-center rounded-xl bg-zinc-950 px-3 text-sm font-semibold text-white">{todayTasks.length}</span>
        </div>
        <div className="mt-5 space-y-2">
          {todayTasks.slice(0, 3).map((task) => <DashboardTaskRow key={task.id} task={task} />)}
          {!todayTasks.length && <p className="rounded-xl bg-zinc-50 px-4 py-5 text-sm text-zinc-500">Nenhuma pendência para hoje.</p>}
        </div>
        <Link href="/tarefas" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white">Abrir tarefas <ArrowRight size={16} /></Link>
      </div>

      <div className="studio-card rounded-[28px] p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase text-zinc-500">Visão da semana</p><h2 className="mt-2 text-xl font-semibold text-zinc-950">Próximas tarefas</h2></div>
          <div className="text-right"><p className="text-3xl font-semibold tracking-tight text-zinc-950">{pending.length}</p><p className="text-xs font-medium text-zinc-500">pendentes</p></div>
        </div>
        <div className="mt-5 space-y-2">
          {upcoming.map((task) => <DashboardTaskRow key={task.id} task={task} showDay />)}
          {!upcoming.length && <p className="rounded-xl bg-zinc-50 px-4 py-5 text-sm text-zinc-500">A semana está organizada.</p>}
        </div>
      </div>
    </section>
  );
}

function DashboardTaskRow({ task, showDay }: { task: StudioTask; showDay?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-zinc-600 shadow-sm"><CheckSquare2 size={16} /></span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-800">{task.title}</p><p className="mt-0.5 text-xs font-medium text-zinc-500">{showDay ? task.day : task.category}</p></div>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-zinc-500"><Clock3 size={13} />{formatMinutes(getEstimatedMinutes(task))}</span>
    </div>
  );
}
