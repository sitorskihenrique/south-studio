"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CheckSquare2, CircleDot, Film, Search, SlidersHorizontal, WalletCards } from "lucide-react";

type ProjectStatus = "Pré-produção" | "Produção" | "Pós" | "Entregue" | "Em espera";
type ProjectPriority = "Alta" | "Média" | "Baixa";

interface StudioProject {
  id: string;
  title: string;
  client: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: string;
  progress: number;
  team: string;
  budget: string;
  tasks: number;
  tags: string[];
}

const statuses: Array<"Todos" | ProjectStatus> = ["Todos", "Pré-produção", "Produção", "Pós", "Entregue", "Em espera"];

const projects: StudioProject[] = [
  {
    id: "brand-film",
    title: "Brand Film Inverno",
    client: "Noma Studio",
    status: "Produção",
    priority: "Alta",
    deadline: "18 jun",
    progress: 62,
    team: "6 pessoas",
    budget: "R$ 48k",
    tasks: 14,
    tags: ["Campanha", "Set externo", "Hero"],
  },
  {
    id: "social-launch",
    title: "Lançamento Social",
    client: "Casa Aster",
    status: "Pré-produção",
    priority: "Média",
    deadline: "24 jun",
    progress: 34,
    team: "4 pessoas",
    budget: "R$ 18k",
    tasks: 9,
    tags: ["Reels", "Produto", "Estúdio"],
  },
  {
    id: "documentary",
    title: "Mini doc fundador",
    client: "Vértice",
    status: "Pós",
    priority: "Alta",
    deadline: "02 jul",
    progress: 78,
    team: "3 pessoas",
    budget: "R$ 32k",
    tasks: 7,
    tags: ["Entrevista", "Documental", "Cor"],
  },
  {
    id: "monthly-content",
    title: "Conteúdo mensal",
    client: "South Lab",
    status: "Em espera",
    priority: "Baixa",
    deadline: "A definir",
    progress: 18,
    team: "2 pessoas",
    budget: "R$ 12k",
    tasks: 5,
    tags: ["Always on", "Social", "Retainer"],
  },
];

const statusStyle: Record<ProjectStatus, string> = {
  "Pré-produção": "bg-sky-50 text-sky-700",
  Produção: "bg-zinc-950 text-white",
  Pós: "bg-amber-50 text-amber-800",
  Entregue: "bg-emerald-50 text-emerald-700",
  "Em espera": "bg-zinc-100 text-zinc-600",
};

export function ProjectsBoard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Todos");

  const visibleProjects = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    return projects.filter((project) => {
      const matchesSearch = !normalized || `${project.title} ${project.client} ${project.tags.join(" ")}`.toLocaleLowerCase("pt-BR").includes(normalized);
      const matchesStatus = status === "Todos" || project.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1380px] px-4 py-5 sm:px-8 lg:px-10 lg:py-9 fade-in">
        <header className="relative overflow-hidden rounded-[32px] bg-zinc-950 p-6 text-white shadow-2xl shadow-zinc-950/18 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.22),transparent_24%),linear-gradient(135deg,rgba(20,20,20,0),rgba(120,113,108,0.32))]" />
          <div className="relative max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/48">Projetos</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">Toda produção por cliente.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/62">Status, prazo, tarefas, orçamento e plano em uma visão clara para execução.</p>
          </div>
        </header>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar projeto, cliente ou tag" className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white/82 pl-11 pr-4 text-sm outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-950/5" />
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <select value={status} onChange={(event) => setStatus(event.target.value as (typeof statuses)[number])} className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white/82 pl-11 pr-4 text-sm font-semibold text-zinc-700 outline-none transition focus:border-zinc-400">
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleProjects.map((project) => (
            <article key={project.id} className="studio-card overflow-hidden rounded-[30px]">
              <div className="h-36 bg-zinc-950 p-4 text-white">
                <div className="flex h-full items-start justify-between gap-3 rounded-[24px] bg-[radial-gradient(circle_at_26%_18%,rgba(255,255,255,0.32),transparent_18%),linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))] p-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[project.status]}`}>{project.status}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">{project.priority}</span>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-sm font-semibold text-zinc-500">{project.client}</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{project.title}</h2>
                  </div>
                  <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Prazo</p>
                    <p className="text-sm font-semibold text-zinc-800">{project.deadline}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-500">
                    <span>Progresso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-zinc-950" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Metric icon={CheckSquare2} label="Tarefas" value={String(project.tasks)} />
                  <Metric icon={WalletCards} label="Orçamento" value={project.budget} />
                  <Metric icon={Film} label="Equipe" value={project.team} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {project.tags.map((tag) => <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">{tag}</span>)}
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                  <ToolLink href="/tarefas" label="Tarefas" icon={CheckSquare2} />
                  <ToolLink href="/calculadora" label="Orçamento" icon={WalletCards} />
                  <ToolLink href="/plano-de-filmagem" label="Plano" icon={CalendarClock} />
                </div>
              </div>
            </article>
          ))}
        </div>

        {!visibleProjects.length && (
          <div className="mt-5 rounded-[28px] border border-dashed border-zinc-300 bg-white/70 px-5 py-12 text-center">
            <p className="text-base font-semibold text-zinc-800">Nenhum projeto encontrado.</p>
            <p className="mt-2 text-sm text-zinc-500">Ajuste busca ou filtro para ver sua produção.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof CircleDot; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-100/80 p-3">
      <Icon size={16} className="text-zinc-500" />
      <p className="mt-3 text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function ToolLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof CircleDot }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950">
      <Icon size={16} />
      {label}
      <ArrowRight size={14} />
    </Link>
  );
}
