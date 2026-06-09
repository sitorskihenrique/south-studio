"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CheckSquare2, Film, FolderPlus, Pencil, Plus, Search, SlidersHorizontal, WalletCards } from "lucide-react";
import { emptyProjectDraft } from "@/lib/projects/defaults";
import { normalizeProject, normalizeProjects, progressForStatus, readProjects, writeProjects } from "@/lib/projects/storage";
import { projectStatuses, type ProjectDetailTab, type ProjectDraft, type ProjectStatus, type StudioProject } from "@/lib/projects/types";
import { deleteCloudItem, readCloudItems, upsertCloudItem } from "@/lib/supabase/data";
import { ProjectDetailModal } from "./ProjectDetailModal";
import { ProjectFormModal } from "./ProjectFormModal";
import { readTasks } from "@/lib/tasks/storage";
import type { StudioTask } from "@/lib/tasks/types";
import { readLocalStorage, savedBudgetsStorageKey } from "@/lib/budget/storage";
import type { SavedBudget } from "@/lib/budget/types";
import { readFilmPlanStorage, savedFilmPlansKey } from "@/lib/film-plan/storage";
import type { SavedFilmPlan } from "@/lib/film-plan/types";

const statuses: Array<"Todos" | ProjectStatus> = ["Todos", ...projectStatuses];

const statusStyle: Record<ProjectStatus, string> = {
  Ideia: "bg-white/10 text-white",
  "Pré-produção": "bg-sky-50 text-sky-700",
  Produção: "bg-white text-zinc-950",
  "Pós-produção": "bg-amber-50 text-amber-800",
  "Em espera": "bg-zinc-100 text-zinc-600",
  Entregue: "bg-emerald-50 text-emerald-700",
};

export function ProjectsBoard() {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectDraft>({ ...emptyProjectDraft, preProduction: { ...emptyProjectDraft.preProduction } });
  const [tagsText, setTagsText] = useState("");
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null);
  const [detailTab, setDetailTab] = useState<ProjectDetailTab>("Visão geral");
  const [message, setMessage] = useState("");
  const [tasks, setTasks] = useState<StudioTask[]>([]);
  const [budgets, setBudgets] = useState<SavedBudget[]>([]);
  const [plans, setPlans] = useState<SavedFilmPlan[]>([]);

  useEffect(() => {
    let mounted = true;
    setProjects(readProjects());
    setTasks(readTasks());
    setBudgets(readLocalStorage<SavedBudget[]>(savedBudgetsStorageKey, []));
    setPlans(readFilmPlanStorage<SavedFilmPlan[]>(savedFilmPlansKey, []));
    readCloudItems<StudioProject>("projects").then((result) => {
      if (!mounted || !result.authenticated || !result.ok || !result.items.length) return;
      setProjects(normalizeProjects(result.items));
    });
    readCloudItems<StudioTask>("tasks").then((result) => { if (mounted && result.ok && result.items.length) setTasks(result.items); });
    readCloudItems<SavedBudget>("budgets").then((result) => { if (mounted && result.ok && result.items.length) setBudgets(result.items); });
    readCloudItems<SavedFilmPlan>("film_plans").then((result) => { if (mounted && result.ok && result.items.length) setPlans(result.items); });
    return () => { mounted = false; };
  }, []);

  const visibleProjects = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    return projects.map((project, index) => normalizeProject(project, index)).filter((project) => {
      const matchesSearch = !normalized || `${project.title} ${project.client} ${project.tags.join(" ")}`.toLocaleLowerCase("pt-BR").includes(normalized);
      return matchesSearch && (status === "Todos" || project.status === status);
    });
  }, [projects, search, status]);

  async function persist(project: StudioProject, success: string) {
    try {
      const normalized = normalizeProject(project);
      const next = projects.some((item) => item.id === normalized.id) ? projects.map((item) => item.id === normalized.id ? normalized : item) : [normalized, ...projects];
      if (!writeProjects(next)) throw new Error("localStorage unavailable");
      setProjects(next);
      setActiveProject((current) => current?.id === normalized.id ? normalized : current);
      setMessage(success);
      const result = await upsertCloudItem("projects", normalized, normalized.title);
      if (result.authenticated && !result.ok) setMessage(`${success} Sincronização pendente.`);
      return true;
    } catch {
      setMessage("Não foi possível criar o projeto. Tente novamente.");
      return false;
    }
  }

  function openCreate() {
    setEditingId(null);
    setDraft({ ...emptyProjectDraft, preProduction: { ...emptyProjectDraft.preProduction } });
    setTagsText("");
    setFormOpen(true);
  }

  function openEdit(project: StudioProject) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, related: _related, ...projectDraft } = project;
    setEditingId(project.id);
    setDraft(projectDraft);
    setTagsText(project.tags.join(", "));
    setFormOpen(true);
  }

  async function submitProject() {
    const title = String(draft.title || "").trim();
    if (!title) return setMessage("Informe o nome do projeto.");
    const previous = projects.find((project) => project.id === editingId);
    const now = new Date().toISOString();
    const project: StudioProject = {
      ...draft,
      title,
      client: String(draft.client || "").trim(),
      tags: String(tagsText || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12),
      progress: progressForStatus(draft.status, previous?.progress),
      id: previous?.id || crypto.randomUUID(),
      createdAt: previous?.createdAt || now,
      updatedAt: now,
      related: previous?.related || { taskIds: [], budgetIds: [], filmPlanIds: [] },
    };
    const saved = await persist(project, previous ? "Projeto atualizado." : "Projeto criado.");
    if (saved) setFormOpen(false);
  }

  function openProject(project: StudioProject, tab: ProjectDetailTab = "Visão geral") {
    setActiveProject(project);
    setDetailTab(tab);
  }

  function savePreProduction() {
    if (!activeProject) return;
    persist({ ...activeProject, updatedAt: new Date().toISOString() }, "Pré-produção salva.");
  }

  async function deleteProject(project: StudioProject) {
    if (!window.confirm(`Excluir o projeto "${project.title}"? Os itens vinculados serão mantidos.`)) return;
    try {
      const next = projects.filter((item) => item.id !== project.id);
      if (!writeProjects(next)) throw new Error("localStorage unavailable");
      setProjects(next);
      setActiveProject(null);
      const result = await deleteCloudItem("projects", project.id);
      setMessage(result.authenticated && !result.ok ? "Projeto removido deste dispositivo. Sincronização pendente." : "Projeto excluído.");
    } catch {
      setMessage("Não foi possível excluir o projeto. Tente novamente.");
    }
  }

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1380px] px-4 py-5 sm:px-8 lg:px-10 lg:py-9 fade-in">
        <header className="studio-card rounded-[32px] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-4xl"><p className="text-xs font-semibold uppercase text-zinc-500">Projetos</p><h1 className="mt-5 text-4xl font-semibold text-zinc-950 sm:text-6xl">Toda produção em um só lugar.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">Centralize visão geral, pré-produção, tarefas, orçamento e plano de filmagem.</p></div>
            <button type="button" onClick={openCreate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white"><Plus size={18} />Criar projeto</button>
          </div>
        </header>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /><span className="sr-only">Buscar projeto</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar projeto, cliente ou tag" className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-zinc-400" /></label>
          <label className="relative"><SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /><span className="sr-only">Filtrar projetos por status</span><select value={status} onChange={(event) => setStatus(event.target.value as (typeof statuses)[number])} className="min-h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 text-sm font-semibold text-zinc-700 outline-none">{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>

        {message && <p className="mt-4 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white">{message}</p>}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleProjects.map((project) => <ProjectCard key={project.id} project={project} onOpen={() => openProject(project)} onEdit={() => openEdit(project)} onPreProduction={() => openProject(project, "Pré-produção")} />)}
        </div>

        {!visibleProjects.length && (
          <div className="mt-5 rounded-[28px] border border-dashed border-zinc-300 bg-white/70 px-5 py-14 text-center">
            <FolderPlus className="mx-auto text-zinc-400" size={28} /><p className="mt-5 text-lg font-semibold text-zinc-800">Nenhum projeto criado ainda.</p><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">Crie seu primeiro projeto para organizar orçamento, tarefas e plano de filmagem em um só lugar.</p><button type="button" onClick={openCreate} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white"><Plus size={17} />Criar projeto</button>
          </div>
        )}
      </div>

      <ProjectFormModal open={formOpen} editing={Boolean(editingId)} draft={draft} tagsText={tagsText} onChange={setDraft} onTagsChange={setTagsText} onClose={() => setFormOpen(false)} onSubmit={submitProject} />
      <ProjectDetailModal project={activeProject} tasks={tasks.filter((item) => item?.projectId === activeProject?.id)} budgets={budgets.filter((item) => (item?.projectId || item?.budget?.projectId) === activeProject?.id)} plans={plans.filter((item) => (item?.projectId || item?.plan?.projectId) === activeProject?.id)} activeTab={detailTab} onTabChange={setDetailTab} onChange={setActiveProject} onSave={savePreProduction} onEdit={() => activeProject && openEdit(activeProject)} onDelete={() => activeProject && deleteProject(activeProject)} onClose={() => setActiveProject(null)} />
    </section>
  );
}

function ProjectCard({ project, onOpen, onEdit, onPreProduction }: { project: StudioProject; onOpen: () => void; onEdit: () => void; onPreProduction: () => void }) {
  return (
    <article className="studio-card overflow-hidden rounded-[30px]">
      <div className="flex min-h-28 items-start justify-between gap-3 bg-zinc-950 p-5 text-white"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[project.status]}`}>{project.status}</span><button type="button" onClick={onEdit} aria-label={`Editar ${project.title}`} className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white"><Pencil size={17} /></button></div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><p className="text-sm font-semibold text-zinc-500">{project.client || "Cliente não informado"}</p><h2 className="mt-1 break-words text-2xl font-semibold text-zinc-950">{project.title}</h2></div><div className="shrink-0 rounded-2xl bg-zinc-100 px-3 py-2 text-right"><p className="text-[11px] font-semibold uppercase text-zinc-400">Prazo</p><p className="text-sm font-semibold text-zinc-800">{formatDate(project.deadline)}</p></div></div>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-500">{project.description || "Sem descrição breve."}</p>
        <div className="mt-5"><div className="mb-2 flex justify-between text-xs font-semibold text-zinc-500"><span>Progresso · {project.priority}</span><span>{project.progress}%</span></div><div className="h-2 rounded-full bg-zinc-100"><div className="h-full rounded-full bg-zinc-950" style={{ width: `${project.progress}%` }} /></div></div>
        <div className="mt-5 flex flex-wrap gap-2">{project.tags.map((tag) => <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">{tag}</span>)}</div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" onClick={onOpen} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-3 text-sm font-semibold text-white sm:col-span-3">Abrir projeto <ArrowRight size={15} /></button>
          <ToolLink href={`/tarefas?project=${project.id}`} label="Tarefas" icon={CheckSquare2} />
          <ToolLink href={`/calculadora?project=${project.id}`} label="Orçamento" icon={WalletCards} />
          <ToolLink href={`/plano-de-filmagem?project=${project.id}`} label="Plano" icon={CalendarClock} />
          <button type="button" onClick={onPreProduction} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-3 text-sm font-semibold text-zinc-700 sm:col-span-3"><Film size={16} />Pré-produção</button>
        </div>
      </div>
    </article>
  );
}

function ToolLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Film }) {
  return <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700"><Icon size={15} />{label}</Link>;
}

function formatDate(value: string) {
  if (!value) return "A definir";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(year, month - 1, day));
}
