"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarDays,
  CheckSquare2,
  Clapperboard,
  Folder,
  FolderKanban,
  Grid2X2,
  ListChecks,
  Plus,
  Search,
  WalletCards,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { readCloudItems } from "@/lib/supabase/data";
import { savedBudgetsStorageKey } from "@/lib/budget/storage";
import type { SavedBudget } from "@/lib/budget/types";
import { projectsStorageKey } from "@/lib/projects/storage";
import type { StudioProject } from "@/lib/projects/types";
import { tasksStorageKey } from "@/lib/tasks/storage";
import type { StudioTask } from "@/lib/tasks/types";

type DashboardState = {
  user: User | null;
  projects: StudioProject[];
  tasks: StudioTask[];
  budgets: SavedBudget[];
  loading: boolean;
};

const fakeProjectIds = new Set(["projeto-exemplo"]);
const fakeTaskIds = new Set(["tarefa-guia", "tarefa-inicial-1", "tarefa-inicial-2", "tarefa-inicial-3"]);
const blockedProjectNames = ["mv1 champion edition", "campanha simmons", "smurfit westrock", "projeto exemplo"];

const sidebarItems = [
  { label: "Projetos", detail: "Gerencie sua carteira", href: "/projetos", icon: Grid2X2 },
  { label: "Tarefas", detail: "Pendências do dia", href: "/tarefas", icon: ListChecks },
  { label: "Orçamentos", detail: "Valores e contratos", href: "/calculadora", icon: WalletCards },
  { label: "Roteiros", detail: "Produções planejadas", href: "/plano-de-filmagem", icon: Clapperboard },
  { label: "Calendário", detail: "Prazos e entregas", href: "/tarefas", icon: CalendarDays },
];

export function DashboardExperience() {
  const [state, setState] = useState<DashboardState>({ user: null, projects: [], tasks: [], budgets: [], loading: true });
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      const supabase = createClient();
      const user = supabase ? (await supabase.auth.getUser()).data.user : null;
      const [cloudProjects, cloudTasks, cloudBudgets] = await Promise.all([
        readCloudItems<StudioProject>("projects"),
        readCloudItems<StudioTask>("tasks"),
        readCloudItems<SavedBudget>("budgets"),
      ]);

      if (!alive) return;

      setState({
        user,
        projects: cleanProjects(cloudProjects.authenticated && cloudProjects.ok ? cloudProjects.items : readLocalArray<StudioProject>(projectsStorageKey)),
        tasks: cleanTasks(cloudTasks.authenticated && cloudTasks.ok ? cloudTasks.items : readLocalArray<StudioTask>(tasksStorageKey)),
        budgets: cleanBudgets(cloudBudgets.authenticated && cloudBudgets.ok ? cloudBudgets.items : readLocalArray<SavedBudget>(savedBudgetsStorageKey)),
        loading: false,
      });
    }

    loadDashboard();

    return () => {
      alive = false;
    };
  }, []);

  const displayName = getDisplayName(state.user);
  const greeting = getGreeting();
  const pendingTasks = state.tasks.filter((task) => task.status !== "Concluída");
  const activeProjects = state.projects.filter((project) => project.status !== "Entregue");
  const nextDeadline = getNextDeadline(activeProjects);
  const activeRevenue = state.budgets
    .filter((budget) => !["Reprovado", "Arquivado"].includes(budget.status))
    .reduce((total, budget) => total + safeMoney(budget.finalValue), 0);

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return activeProjects;
    return activeProjects.filter((project) => `${project.title} ${project.client}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [activeProjects, search]);

  const metrics = [
    { label: "Projetos ativos", value: String(activeProjects.length), icon: FolderKanban, accent: "text-violet-300", dot: "bg-violet-400" },
    { label: "Tarefas pendentes", value: String(pendingTasks.length), icon: ListChecks, accent: "text-orange-300", dot: "bg-orange-400" },
    { label: "Próximo prazo", value: nextDeadline, icon: CalendarDays, accent: "text-indigo-300", dot: "bg-indigo-400" },
    { label: "Receita ativa", value: formatCurrency(activeRevenue), icon: BadgeDollarSign, accent: "text-emerald-300", dot: "bg-emerald-400" },
  ];

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#f5f6f8] text-zinc-950">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1540px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 lg:py-10">
        <aside className="rounded-[30px] border border-white/75 bg-white/56 p-4 shadow-[0_22px_70px_rgba(16,24,40,0.08)] backdrop-blur-2xl lg:min-h-[calc(100dvh-5rem)] lg:p-6">
          <Link href="/dashboard" className="block px-1 py-2">
            <span className="text-[22px] font-black uppercase tracking-normal text-zinc-950">South Studio</span>
            <span className="align-super text-[10px] font-black">TM</span>
          </Link>

          <nav className="mt-5 flex gap-3 overflow-x-auto pb-2 lg:mt-12 lg:flex-col lg:overflow-visible lg:pb-0">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex min-w-[210px] items-center gap-4 rounded-[22px] border px-4 py-4 transition lg:min-w-0 ${
                    index === 0
                      ? "border-white bg-white/82 shadow-[0_18px_44px_rgba(16,24,40,0.08)]"
                      : "border-white/55 bg-white/42 hover:bg-white/78"
                  }`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-zinc-700">
                    <Icon size={25} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[17px] font-semibold text-zinc-950">{item.label}</span>
                    <span className="mt-1 block truncate text-sm font-medium text-zinc-500">{item.detail}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-[30px] border border-white/10 bg-[#121824] p-5 text-white shadow-[0_28px_80px_rgba(15,23,42,0.26)] sm:p-8 lg:rounded-[34px] lg:p-12">
          <div className="mx-auto flex h-full max-w-[1040px] flex-col">
            <div className="pt-2 sm:pt-4 lg:pt-10">
              <p className="text-sm font-semibold uppercase text-white/35">{state.loading ? "Carregando workspace" : "Workspace audiovisual"}</p>
              <h1 className="mt-5 text-[42px] font-semibold leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
                {greeting}, {displayName}.
              </h1>
              <p className="mt-5 text-xl font-medium text-white/52 sm:text-2xl">Qual projeto vamos produzir hoje?</p>
            </div>

            <label className="mt-9 flex min-h-16 items-center gap-4 rounded-[18px] border border-white/10 bg-white/[0.055] px-5 text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition focus-within:border-white/22 focus-within:bg-white/[0.075]">
              <Search size={29} strokeWidth={1.75} className="shrink-0 text-white/58" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar projeto..."
                className="h-14 min-w-0 flex-1 bg-transparent text-lg font-medium text-white outline-none placeholder:text-white/40"
              />
            </label>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <article key={metric.label} className="rounded-[18px] border border-white/10 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[34px] font-semibold leading-none text-white">{metric.value}</p>
                      <Icon size={27} strokeWidth={1.75} className={metric.accent} />
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-sm font-medium text-white/48">
                      {metric.label} <span className={`h-1.5 w-1.5 rounded-full ${metric.dot}`} />
                    </p>
                  </article>
                );
              })}
            </div>

            <section className="mt-9 flex-1">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase text-white/45">Acessos rápidos</h2>
                <span className="hidden rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm font-medium text-white/70 sm:inline-flex">
                  {activeProjects.length} {activeProjects.length === 1 ? "Projeto Ativo" : "Projetos Ativos"}
                </span>
              </div>

              {filteredProjects.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {filteredProjects.slice(0, 7).map((project, index) => (
                    <ProjectAccessCard key={project.id} project={project} index={index} />
                  ))}
                  <NewProjectCard compact />
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/58">
                    <Folder size={28} strokeWidth={1.7} />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-white">Nenhum projeto ainda.</h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/48">Crie seu primeiro projeto para começar.</p>
                  <Link href="/projetos" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-white/88">
                    Novo projeto <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </section>

            <div className="mt-8 flex justify-end">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-5 py-3 text-sm font-medium text-white/70">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                {activeProjects.length} {activeProjects.length === 1 ? "Projeto Ativo" : "Projetos Ativos"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProjectAccessCard({ project, index }: { project: StudioProject; index: number }) {
  const accents = ["border-l-violet-300", "border-l-orange-400", "border-l-indigo-300", "border-l-emerald-300"];
  const dot = project.status === "Produção" ? "bg-emerald-400" : project.status === "Pós-produção" ? "bg-orange-400" : "bg-indigo-400";

  return (
    <Link
      href="/projetos"
      className={`group min-h-[186px] rounded-[18px] border border-white/10 border-l-2 ${accents[index % accents.length]} bg-white/[0.05] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/[0.075]`}
    >
      <Folder size={31} strokeWidth={1.75} className="text-white/58 transition group-hover:text-white" />
      <div className="mt-14">
        <h3 className="line-clamp-2 text-base font-semibold leading-5 text-white">{project.title}</h3>
        <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white/70">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
          <span className="truncate">{project.status}</span>
        </p>
      </div>
    </Link>
  );
}

function NewProjectCard({ compact }: { compact?: boolean }) {
  return (
    <Link href="/projetos" className="group min-h-[186px] rounded-[18px] border border-white/10 bg-white/[0.04] p-5 text-white/56 transition hover:bg-white/[0.07] hover:text-white">
      <Plus size={32} strokeWidth={1.7} />
      <div className={compact ? "mt-14" : "mt-12"}>
        <h3 className="text-base font-semibold text-white">Novo Projeto</h3>
        <p className="mt-2 text-sm font-medium text-white/45">Criar do zero</p>
      </div>
    </Link>
  );
}

function readLocalArray<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function cleanProjects(projects: StudioProject[]) {
  return projects.filter((project) => {
    const title = typeof project.title === "string" ? project.title.trim() : "";
    if (!title || fakeProjectIds.has(project.id)) return false;
    return !blockedProjectNames.includes(title.toLocaleLowerCase("pt-BR"));
  });
}

function cleanTasks(tasks: StudioTask[]) {
  return tasks.filter((task) => typeof task.title === "string" && task.title.trim() && !fakeTaskIds.has(task.id));
}

function cleanBudgets(budgets: SavedBudget[]) {
  return budgets.filter((budget) => typeof budget.id === "string" && budget.id && budget.projectName !== "Orçamento sem nome");
}

function getDisplayName(user: User | null) {
  const metadata = user?.user_metadata ?? {};
  const name = typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : "";
  const firstName = name.trim().split(" ")[0];
  if (firstName) return firstName;
  return user?.email?.split("@")[0] || "usuário";
}

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getNextDeadline(projects: StudioProject[]) {
  const now = new Date();
  const deadlines = projects
    .map((project) => new Date(project.deadline))
    .filter((date) => Number.isFinite(date.getTime()) && date >= startOfDay(now))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!deadlines.length) return "0d";
  const diff = deadlines[0].getTime() - startOfDay(now).getTime();
  return `${Math.max(0, Math.ceil(diff / 86400000))}d`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatCurrency(value: number) {
  if (!value) return "R$0";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function safeMoney(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
