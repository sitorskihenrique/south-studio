import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { StudioTask } from "@/lib/tasks/types";

const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

export function TaskCalendar({
  tasks,
  selectedDate,
  onSelectDate,
  onOpenTask,
}: {
  tasks: StudioTask[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenTask: (task: StudioTask) => void;
}) {
  // Futura integração com Google Calendar: eventos externos poderão compartilhar esta mesma grade por data.
  const initial = selectedDate ? parseDate(selectedDate) : new Date();
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const cells = useMemo(() => buildMonth(month), [month]);
  const selectedTasks = selectedDate ? tasks.filter((task) => task.specificDate === selectedDate) : [];

  function changeMonth(offset: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="studio-card rounded-[28px] p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400">Calendário</p>
            <h2 className="mt-2 text-xl font-semibold capitalize text-zinc-950">{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h2>
          </div>
          <div className="flex gap-2">
            <CalendarButton label="Mês anterior" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></CalendarButton>
            <CalendarButton label="Próximo mês" onClick={() => changeMonth(1)}><ChevronRight size={18} /></CalendarButton>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day, index) => <span key={`${day}-${index}`} className="py-2 text-[11px] font-semibold text-zinc-400">{day}</span>)}
          {cells.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} className="aspect-square" />;
            const iso = toDateInput(date);
            const dateTasks = tasks.filter((task) => task.specificDate === iso);
            const active = selectedDate === iso;
            return (
              <button key={iso} type="button" onClick={() => onSelectDate(iso)} className={`aspect-square min-h-11 rounded-2xl border p-1 transition ${active ? "border-zinc-950 bg-zinc-950 text-white" : "border-transparent text-zinc-700 hover:border-zinc-200 hover:bg-zinc-50"}`}>
                <span className="block text-xs font-semibold">{date.getDate()}</span>
                <span className="mt-1 flex min-h-2 justify-center gap-0.5">
                  {dateTasks.slice(0, 4).map((task) => <span key={task.id} className={`h-1.5 w-1.5 rounded-full ${dotColor(task)}`} />)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-5 text-xs text-zinc-400">Estrutura preparada para futura integração com Google Calendar.</p>
      </div>

      <aside className="studio-card rounded-[28px] p-4 sm:p-6">
        <p className="text-xs font-semibold uppercase text-zinc-400">Dia selecionado</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-950">{selectedDate ? formatLongDate(selectedDate) : "Selecione uma data"}</h2>
        <div className="mt-5 space-y-2">
          {selectedTasks.map((task) => (
            <button key={task.id} type="button" onClick={() => onOpenTask(task)} className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-left hover:border-zinc-300">
              <p className="text-sm font-semibold text-zinc-900">{task.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{task.category} · {task.priority} · {task.status}</p>
            </button>
          ))}
          {selectedDate && !selectedTasks.length && <p className="rounded-2xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">Nenhuma tarefa nesta data.</p>}
        </div>
      </aside>
    </section>
  );
}

function CalendarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-label={label} onClick={onClick} className="grid h-11 w-11 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400">{children}</button>;
}

function buildMonth(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [...Array(first.getDay()).fill(null), ...Array.from({ length: lastDay }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))] as Array<Date | null>;
}

function dotColor(task: StudioTask) {
  if (task.priority === "Urgente") return "bg-red-500";
  if (task.status === "Concluída") return "bg-emerald-500";
  if (task.status === "Em progresso") return "bg-blue-500";
  return "bg-zinc-400";
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(value: string) {
  return parseDate(value).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}
