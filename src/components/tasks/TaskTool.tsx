"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCheck, ListFilter, Plus, Search, Tags } from "lucide-react";
import { emptyTaskDraft, defaultTasks } from "@/lib/tasks/defaults";
import { filterTasks, getTodayTaskDay, taskSummary } from "@/lib/tasks/filters";
import { normalizeTasks, readTasks, writeTasks } from "@/lib/tasks/storage";
import {
  taskCategories,
  taskDays,
  taskStatuses,
  type StudioTask,
  type TaskCategoryFilter,
  type TaskDay,
  type TaskDayFilter,
  type TaskDraft,
  type TaskStatusFilter,
} from "@/lib/tasks/types";
import { readCloudItems, replaceCloudItems } from "@/lib/supabase/data";
import { TaskCalendar } from "./TaskCalendar";
import { TaskCard } from "./TaskCard";
import { TaskFormSheet } from "./TaskFormSheet";
import { TaskSummary } from "./TaskSummary";
import { TaskWeekView } from "./TaskWeekView";

const dayTabs: TaskDayFilter[] = ["Visão da Semana", "Hoje", ...taskDays, "Calendário", "Concluídas"];

export function TaskTool() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project") || "";
  const initialView = searchParams.get("view");
  const [tasks, setTasks] = useState<StudioTask[]>(defaultTasks);
  const [selectedDay, setSelectedDay] = useState<TaskDayFilter>(initialView === "calendar" ? "Calendário" : "Visão da Semana");
  const [selectedDate, setSelectedDate] = useState("");
  const [status, setStatus] = useState<TaskStatusFilter>("Todos");
  const [category, setCategory] = useState<TaskCategoryFilter>("Todas");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft>({ ...emptyTaskDraft, projectId: initialProjectId, day: getTodayTaskDay() });
  const [message, setMessage] = useState("");
  const [storageLabel, setStorageLabel] = useState("Modo local");

  useEffect(() => {
    let mounted = true;
    setTasks(readTasks());

    readCloudItems<StudioTask>("tasks").then((result) => {
      if (!mounted) return;
      if (!result.authenticated) return setStorageLabel("Modo local");
      setStorageLabel(result.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
      if (result.ok && result.items.length) setTasks(normalizeTasks(result.items));
    });

    return () => { mounted = false; };
  }, []);

  const visibleTasks = useMemo(() => filterTasks(tasks, selectedDay, status, category, search), [category, search, selectedDay, status, tasks]);
  const summary = taskSummary(tasks);

  function persist(next: StudioTask[], successMessage: string) {
    setTasks(next);
    const ok = writeTasks(next);
    setMessage(ok ? successMessage : "Não foi possível salvar as alterações neste navegador.");
    replaceCloudItems("tasks", next, (task) => task.title || "Tarefa", { deleteMissing: true }).then((result) => {
      if (!result.authenticated) return;
      setStorageLabel(result.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
      if (!result.ok) setMessage(`${successMessage} Sincronização pendente.`);
    });
  }

  function openNewTask() {
    setEditingId(null);
    const day = taskDays.includes(selectedDay as TaskDay) ? selectedDay as TaskDay : getTodayTaskDay();
    setDraft({ ...emptyTaskDraft, projectId: initialProjectId, day, specificDate: selectedDay === "Calendário" ? selectedDate : "" });
    setSheetOpen(true);
  }

  function openEditTask(task: StudioTask) {
    const { id: _id, createdAt: _createdAt, ...taskDraft } = task;
    setEditingId(task.id);
    setDraft(taskDraft);
    setSheetOpen(true);
  }

  function submitTask() {
    const title = draft.title.trim();
    if (!title) return setMessage("Digite um título para a tarefa.");
    if (title.length > 140) return setMessage("Use um título com até 140 caracteres.");
    if (draft.specificDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.specificDate)) return setMessage("Escolha uma data específica válida.");

    if (editingId) {
      persist(tasks.map((task) => task.id === editingId ? { ...task, ...draft, title } : task), "Tarefa atualizada.");
    } else {
      persist([{ ...draft, title, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...tasks], "Tarefa criada.");
    }
    setSheetOpen(false);
  }

  function toggleTask(task: StudioTask) {
    const nextStatus = task.status === "Concluída" ? "A fazer" : "Concluída";
    persist(tasks.map((item) => item.id === task.id ? { ...item, status: nextStatus } : item), nextStatus === "Concluída" ? "Tarefa concluída." : "Tarefa reaberta.");
  }

  function duplicateTask(task: StudioTask) {
    persist([{ ...task, id: crypto.randomUUID(), title: `Cópia de ${task.title}`, status: "A fazer", createdAt: new Date().toISOString() }, ...tasks], "Tarefa duplicada.");
  }

  function deleteTask(task: StudioTask) {
    if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return;
    persist(tasks.filter((item) => item.id !== task.id), "Tarefa excluída.");
  }

  function moveTask(task: StudioTask, day: TaskDay) {
    persist(tasks.map((item) => item.id === task.id ? { ...item, day } : item), `Tarefa movida para ${day}.`);
  }

  function clearCompleted() {
    if (!summary.completed || !window.confirm("Remover todas as tarefas concluídas?")) return;
    persist(tasks.filter((task) => task.status !== "Concluída"), "Tarefas concluídas removidas.");
  }

  function openDay(day: TaskDay) {
    setSelectedDay(day);
  }

  function selectCalendarDate(date: string) {
    setSelectedDate(date);
  }

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1460px] px-4 py-5 sm:px-8 lg:px-10 lg:py-9 fade-in">
        <header className="studio-card rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-500">Semana em movimento</p>
              <h1 className="mt-4 text-4xl font-semibold text-zinc-950 sm:text-6xl">Tarefas</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500">{summary.todo} a fazer, {summary.progress} em progresso e {summary.completed} concluídas.</p>
              <p className="mt-2 text-xs font-medium text-zinc-400">{storageLabel}</p>
            </div>
            <button type="button" onClick={openNewTask} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-fit">
              <Plus size={18} />Nova tarefa
            </button>
          </div>
        </header>

        <div className="mt-6"><TaskSummary tasks={tasks} /></div>

        <div className="hide-scrollbar -mx-3 mt-6 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Visualizações de tarefas">
          {dayTabs.map((day) => <button key={day} type="button" role="tab" aria-selected={selectedDay === day} onClick={() => setSelectedDay(day)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition ${selectedDay === day ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/10" : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"}`}>{day}</button>)}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_190px_190px_auto]">
          <label className="relative">
            <span className="sr-only">Buscar tarefa</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tarefa por nome" className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-950/5" />
          </label>
          <FilterSelect icon={<ListFilter size={17} />} label="Filtrar por status" value={status} onChange={(value) => setStatus(value as TaskStatusFilter)}>
            <option value="Todos">Todos os status</option>
            {taskStatuses.map(option)}
          </FilterSelect>
          <FilterSelect icon={<Tags size={17} />} label="Filtrar por categoria" value={category} onChange={(value) => setCategory(value as TaskCategoryFilter)}>
            <option value="Todas">Todas categorias</option>
            {taskCategories.map(option)}
          </FilterSelect>
          <button type="button" onClick={clearCompleted} disabled={!summary.completed} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40">
            <CheckCheck size={17} />Limpar concluídas
          </button>
        </div>

        {message && <p className="mt-4 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white">{message}</p>}

        {selectedDay === "Visão da Semana" && <TaskWeekView tasks={visibleTasks} onOpenDay={openDay} onOpenTask={openEditTask} />}
        {selectedDay === "Calendário" && <TaskCalendar tasks={visibleTasks} selectedDate={selectedDate} onSelectDate={selectCalendarDate} onOpenTask={openEditTask} />}

        {selectedDay !== "Visão da Semana" && selectedDay !== "Calendário" && (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {visibleTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task)} onEdit={() => openEditTask(task)} onDuplicate={() => duplicateTask(task)} onDelete={() => deleteTask(task)} onMove={(day) => moveTask(task, day)} />)}
          </div>
        )}

        {selectedDay !== "Visão da Semana" && selectedDay !== "Calendário" && !visibleTasks.length && (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-5 py-12 text-center">
            <p className="text-base font-semibold text-zinc-800">Nenhuma tarefa por aqui.</p>
            <p className="mt-2 text-sm text-zinc-500">Crie uma nova tarefa ou ajuste os filtros.</p>
            <button type="button" onClick={openNewTask} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white"><Plus size={17} />Nova tarefa</button>
          </div>
        )}
      </div>

      <TaskFormSheet open={sheetOpen} draft={draft} editing={Boolean(editingId)} onChange={setDraft} onClose={() => setSheetOpen(false)} onSubmit={submitTask} />
    </section>
  );
}

function FilterSelect({ icon, label, value, onChange, children }: { icon: React.ReactNode; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</span>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 text-sm font-medium text-zinc-700 outline-none transition focus:border-zinc-400">{children}</select>
    </label>
  );
}

function option(value: string) {
  return <option key={value} value={value}>{value}</option>;
}
