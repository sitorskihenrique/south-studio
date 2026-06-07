"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCheck, ListFilter, Plus, Search } from "lucide-react";
import { emptyTaskDraft, defaultTasks } from "@/lib/tasks/defaults";
import { filterTasks, getTodayTaskDay, taskSummary } from "@/lib/tasks/filters";
import { readTasks, writeTasks } from "@/lib/tasks/storage";
import { taskDays, taskStatuses, type StudioTask, type TaskDay, type TaskDayFilter, type TaskDraft, type TaskStatusFilter } from "@/lib/tasks/types";
import { TaskCard } from "./TaskCard";
import { TaskFormSheet } from "./TaskFormSheet";
import { TaskSummary } from "./TaskSummary";

const dayTabs: TaskDayFilter[] = ["Hoje", ...taskDays];

export function TaskTool() {
  const [tasks, setTasks] = useState<StudioTask[]>(defaultTasks);
  const [selectedDay, setSelectedDay] = useState<TaskDayFilter>("Hoje");
  const [status, setStatus] = useState<TaskStatusFilter>("Todos");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft>({ ...emptyTaskDraft, day: "Segunda" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTasks(readTasks());
  }, []);

  const visibleTasks = useMemo(() => filterTasks(tasks, selectedDay, status, search), [search, selectedDay, status, tasks]);
  const summary = taskSummary(tasks);

  function persist(next: StudioTask[], successMessage: string) {
    setTasks(next);
    setMessage(writeTasks(next) ? successMessage : "Não foi possível salvar as alterações neste navegador.");
  }

  function openNewTask() {
    setEditingId(null);
    setDraft({ ...emptyTaskDraft, day: selectedDay === "Hoje" ? getTodayTaskDay() : selectedDay });
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
    if (!title) return;
    if (editingId) {
      persist(tasks.map((task) => task.id === editingId ? { ...task, ...draft, title } : task), "Tarefa atualizada.");
    } else {
      persist([{ ...draft, title, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...tasks], "Tarefa criada.");
    }
    setSheetOpen(false);
  }

  function toggleTask(task: StudioTask) {
    const status = task.status === "Concluída" ? "A fazer" : "Concluída";
    persist(tasks.map((item) => item.id === task.id ? { ...item, status } : item), status === "Concluída" ? "Tarefa concluída." : "Tarefa reaberta.");
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

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1320px] px-3 py-5 sm:px-7 lg:px-8 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Semana em movimento</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Tarefas</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{summary.todo} a fazer, {summary.progress} em progresso e {summary.completed} concluídas.</p>
          </div>
          <button type="button" onClick={openNewTask} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-lg shadow-zinc-950/15 sm:w-fit">
            <Plus size={18} />Nova tarefa
          </button>
        </header>

        <div className="mt-6"><TaskSummary tasks={tasks} /></div>

        <div className="hide-scrollbar -mx-3 mt-6 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Dias da semana">
          {dayTabs.map((day) => <button key={day} type="button" role="tab" aria-selected={selectedDay === day} onClick={() => setSelectedDay(day)} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${selectedDay === day ? "bg-zinc-950 text-white" : "border border-zinc-200 bg-white text-zinc-600"}`}>{day}</button>)}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_190px_auto]">
          <label className="relative">
            <span className="sr-only">Buscar tarefa</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tarefa por nome" className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
          </label>
          <label className="relative">
            <ListFilter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={17} />
            <span className="sr-only">Filtrar por status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatusFilter)} className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm font-medium text-zinc-700 outline-none focus:border-teal-500">
              <option value="Todos">Todos os status</option>
              {taskStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="button" onClick={clearCompleted} disabled={!summary.completed} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40">
            <CheckCheck size={17} />Limpar concluídas
          </button>
        </div>

        {message && <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{message}</p>}

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {visibleTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task)} onEdit={() => openEditTask(task)} onDuplicate={() => duplicateTask(task)} onDelete={() => deleteTask(task)} onMove={(day) => moveTask(task, day)} />)}
        </div>

        {!visibleTasks.length && (
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
