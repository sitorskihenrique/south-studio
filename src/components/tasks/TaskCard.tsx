import { CalendarDays, Clock3, Copy, Edit3, Trash2 } from "lucide-react";
import { formatMinutes, getEstimatedMinutes } from "@/lib/tasks/filters";
import { taskDays, type StudioTask, type TaskDay } from "@/lib/tasks/types";

const priorityStyles: Record<StudioTask["priority"], { line: string; badge: string }> = {
  Baixa: { line: "border-l-emerald-400", badge: "bg-emerald-50 text-emerald-700" },
  Média: { line: "border-l-amber-400", badge: "bg-amber-50 text-amber-700" },
  Alta: { line: "border-l-orange-500", badge: "bg-orange-50 text-orange-700" },
  Urgente: { line: "border-l-red-500", badge: "bg-red-50 text-red-700" },
};

const statusStyles: Record<StudioTask["status"], string> = {
  "A fazer": "bg-zinc-100 text-zinc-600",
  "Em progresso": "bg-blue-50 text-blue-700",
  "Concluída": "bg-emerald-50 text-emerald-700",
};

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
  onMove,
}: {
  task: StudioTask;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (day: TaskDay) => void;
}) {
  const priority = priorityStyles[task.priority];

  return (
    <article data-testid={`task-card-${task.id}`} className={`studio-card border-l-4 ${priority.line} rounded-[26px] p-4 sm:p-5`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={task.status === "Concluída" ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
          className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition ${task.status === "Concluída" ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 bg-white text-transparent hover:border-zinc-500"}`}
        >
          <span className="text-lg font-bold">✓</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className={`break-words text-base font-semibold leading-6 text-zinc-950 sm:text-lg ${task.status === "Concluída" ? "text-zinc-400 line-through" : ""}`}>{task.title}</h2>
              <p className="mt-1 text-xs font-medium text-zinc-500">{task.category}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${priority.badge}`}>{task.priority}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[task.status]}`}>{task.status}</span>
            </div>
          </div>

          {task.description && <p className="mt-3 break-words text-sm leading-6 text-zinc-600">{task.description}</p>}
          {task.notes && <p className="mt-2 break-words text-xs leading-5 text-zinc-400">{task.notes}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-zinc-100 px-3 text-xs font-semibold text-zinc-600">
              <Clock3 size={14} />{formatMinutes(getEstimatedMinutes(task))}
            </span>
            <span className="inline-flex min-h-9 items-center gap-1.5 px-1 text-xs font-medium text-zinc-400">
              <CalendarDays size={14} />{task.specificDate ? formatSpecificDate(task.specificDate) : task.day}
            </span>
            <label className="relative">
              <span className="sr-only">Mover tarefa para outro dia</span>
              <select value={task.day} onChange={(event) => onMove(event.target.value as TaskDay)} className="min-h-11 rounded-2xl border border-zinc-200 bg-white px-3 pr-8 text-xs font-semibold text-zinc-600 outline-none transition focus:border-zinc-400">
                {taskDays.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t border-zinc-100/80 pt-3">
        <TaskAction label={`Editar ${task.title}`} onClick={onEdit}><Edit3 size={17} /></TaskAction>
        <TaskAction label={`Duplicar ${task.title}`} onClick={onDuplicate}><Copy size={17} /></TaskAction>
        <TaskAction label={`Excluir ${task.title}`} onClick={onDelete} danger><Trash2 size={17} /></TaskAction>
      </div>
    </article>
  );
}

function TaskAction({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className={`grid h-11 w-11 place-items-center rounded-xl transition ${danger ? "text-zinc-400 hover:bg-red-50 hover:text-red-600" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"}`}>{children}</button>;
}

function formatSpecificDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(year, month - 1, day));
}
