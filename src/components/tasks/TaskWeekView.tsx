import { Check, Circle, CircleDot } from "lucide-react";
import { taskDays, type StudioTask, type TaskDay } from "@/lib/tasks/types";

const priorityDot: Record<StudioTask["priority"], string> = {
  Baixa: "bg-emerald-400",
  Média: "bg-amber-400",
  Alta: "bg-orange-500",
  Urgente: "bg-red-500",
};

export function TaskWeekView({
  tasks,
  onOpenDay,
  onOpenTask,
}: {
  tasks: StudioTask[];
  onOpenDay: (day: TaskDay) => void;
  onOpenTask: (task: StudioTask) => void;
}) {
  return (
    <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7" aria-label="Visão da semana">
      {taskDays.map((day) => {
        const dayTasks = tasks.filter((task) => task.day === day);
        return (
          <article key={day} className="studio-card min-w-0 rounded-[24px] p-4">
            <button type="button" onClick={() => onOpenDay(day)} className="flex min-h-11 w-full items-center justify-between gap-3 text-left">
              <span>
                <span className="block text-sm font-semibold text-zinc-950">{day}</span>
                <span className="mt-0.5 block text-xs text-zinc-400">{dayTasks.length} {dayTasks.length === 1 ? "tarefa" : "tarefas"}</span>
              </span>
              <span className="grid h-8 min-w-8 place-items-center rounded-full bg-zinc-950 px-2 text-xs font-semibold text-white">{dayTasks.length}</span>
            </button>

            <div className="mt-3 space-y-2">
              {dayTasks.slice(0, 5).map((task) => (
                <button key={task.id} type="button" onClick={() => onOpenTask(task)} className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-left transition hover:border-zinc-300">
                  <div className="flex items-start gap-2">
                    <StatusIcon status={task.status} />
                    <p className={`min-w-0 flex-1 break-words text-xs font-semibold leading-5 ${task.status === "Concluída" ? "text-zinc-400 line-through" : "text-zinc-800"}`}>{task.title}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-zinc-500">
                    <span className={`h-2 w-2 rounded-full ${priorityDot[task.priority]}`} />
                    <span>{task.priority}</span>
                    <span>·</span>
                    <span>{task.category}</span>
                  </div>
                </button>
              ))}
              {!dayTasks.length && <p className="rounded-2xl border border-dashed border-zinc-200 px-3 py-5 text-center text-xs text-zinc-400">Dia livre</p>}
              {dayTasks.length > 5 && <button type="button" onClick={() => onOpenDay(day)} className="min-h-10 w-full text-xs font-semibold text-zinc-500">Ver mais {dayTasks.length - 5}</button>}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function StatusIcon({ status }: { status: StudioTask["status"] }) {
  if (status === "Concluída") return <Check className="mt-0.5 shrink-0 text-emerald-600" size={14} />;
  if (status === "Em progresso") return <CircleDot className="mt-0.5 shrink-0 text-blue-600" size={14} />;
  return <Circle className="mt-0.5 shrink-0 text-zinc-400" size={14} />;
}
