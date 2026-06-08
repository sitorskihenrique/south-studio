import { CheckCircle2, CircleDot, Clock3, ListChecks, Timer } from "lucide-react";
import { formatMinutes, taskSummary } from "@/lib/tasks/filters";
import type { StudioTask } from "@/lib/tasks/types";

export function TaskSummary({ tasks }: { tasks: StudioTask[] }) {
  const summary = taskSummary(tasks);
  const items = [
    { label: "Total da semana", value: summary.total, icon: ListChecks, color: "text-zinc-700 bg-zinc-100" },
    { label: "A fazer", value: summary.todo, icon: CircleDot, color: "text-amber-700 bg-amber-50" },
    { label: "Em progresso", value: summary.progress, icon: Timer, color: "text-blue-700 bg-blue-50" },
    { label: "Concluídas", value: summary.completed, icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50" },
    { label: "Tempo estimado", value: formatMinutes(summary.minutes), icon: Clock3, color: "text-violet-700 bg-violet-50" },
  ];

  return (
    <div className="hide-scrollbar -mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="studio-card min-w-[152px] snap-start rounded-[24px] p-4 sm:min-w-0">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${item.color}`}><Icon size={17} /></span>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">{item.value}</p>
            <p className="mt-1 text-xs font-medium text-zinc-500">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}
