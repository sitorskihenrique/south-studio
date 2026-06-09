import { taskDays, type StudioTask, type TaskCategoryFilter, type TaskDay, type TaskDayFilter, type TaskStatusFilter, type TaskTime } from "./types";

export function getTodayTaskDay(date = new Date()): TaskDay {
  const day = date.getDay();
  return taskDays[day === 0 ? 6 : day - 1];
}

export function resolveDayFilter(day: TaskDayFilter): TaskDay {
  if (day === "Hoje") return getTodayTaskDay();
  if (day === "Visão da Semana" || day === "Calendário" || day === "Concluídas") return getTodayTaskDay();
  return day;
}

export function filterTasks(tasks: StudioTask[], day: TaskDayFilter, status: TaskStatusFilter, category: TaskCategoryFilter, search: string) {
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const selectedDay = resolveDayFilter(day);

  return tasks.filter((task) => {
    const matchesDay = day === "Visão da Semana" || day === "Calendário" || day === "Concluídas" || task.day === selectedDay;
    const matchesStatus = day === "Concluídas" ? task.status === "Concluída" : status === "Todos" || task.status === status;
    const matchesCategory = category === "Todas" || task.category === category;
    const matchesSearch = !normalizedSearch || `${task.title} ${task.description} ${task.notes}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
    return matchesDay && matchesStatus && matchesCategory && matchesSearch;
  });
}

export function getEstimatedMinutes(task: Pick<StudioTask, "estimatedTime" | "customMinutes">) {
  const minutesByOption: Record<Exclude<TaskTime, "Personalizado">, number> = {
    "15min": 15,
    "30min": 30,
    "1h": 60,
    "2h": 120,
    "4h": 240,
  };

  return task.estimatedTime === "Personalizado"
    ? Math.max(1, task.customMinutes)
    : minutesByOption[task.estimatedTime];
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
}

export function taskSummary(tasks: StudioTask[]) {
  return {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === "A fazer").length,
    progress: tasks.filter((task) => task.status === "Em progresso").length,
    completed: tasks.filter((task) => task.status === "Concluída").length,
    minutes: tasks.reduce((total, task) => total + getEstimatedMinutes(task), 0),
  };
}
