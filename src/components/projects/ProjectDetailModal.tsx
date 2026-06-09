"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, CheckSquare2, FileImage, LayoutDashboard, Pencil, Save, WalletCards, X } from "lucide-react";
import { Field, TextArea } from "@/components/budget/BudgetFields";
import { type ProjectDetailTab, type StudioProject } from "@/lib/projects/types";
import type { StudioTask } from "@/lib/tasks/types";
import type { SavedBudget } from "@/lib/budget/types";
import type { SavedFilmPlan } from "@/lib/film-plan/types";
import { formatCurrency } from "@/lib/budget/calculations";

const tabs: ProjectDetailTab[] = ["Visão geral", "Pré-produção", "Tarefas", "Orçamentos", "Planos de Filmagem", "Arquivos/Referências"];

export function ProjectDetailModal({
  project,
  tasks,
  budgets,
  plans,
  activeTab,
  onTabChange,
  onChange,
  onSave,
  onEdit,
  onClose,
}: {
  project: StudioProject | null;
  tasks: StudioTask[];
  budgets: SavedBudget[];
  plans: SavedFilmPlan[];
  activeTab: ProjectDetailTab;
  onTabChange: (tab: ProjectDetailTab) => void;
  onChange: (project: StudioProject) => void;
  onSave: () => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  if (!project) return null;
  return (
    <div className="fixed inset-0 z-[115] bg-zinc-100 sm:p-4 lg:p-6" role="dialog" aria-modal="true" aria-label={`Detalhe do projeto ${project.title}`}>
      <div className="mx-auto flex h-[100dvh] max-w-[1440px] flex-col overflow-hidden bg-white sm:h-full sm:rounded-[30px] sm:border sm:border-zinc-200">
        <header className="shrink-0 border-b border-zinc-200 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase text-zinc-400">{project.client || "Cliente não informado"}</p><h2 className="mt-2 truncate text-2xl font-semibold text-zinc-950 sm:text-4xl">{project.title}</h2></div>
            <div className="flex gap-2">
              <button type="button" onClick={onEdit} aria-label="Editar projeto" className="grid h-11 w-11 place-items-center rounded-full border border-zinc-200 text-zinc-600"><Pencil size={18} /></button>
              <button type="button" onClick={onClose} aria-label="Fechar detalhe do projeto" className="grid h-11 w-11 place-items-center rounded-full bg-zinc-950 text-white"><X size={18} /></button>
            </div>
          </div>
          <div className="hide-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:-mx-0 sm:px-0" role="tablist" aria-label="Áreas do projeto">
            {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => onTabChange(tab)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${activeTab === tab ? "bg-zinc-950 text-white" : "border border-zinc-200 text-zinc-600"}`}>{tab}</button>)}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === "Visão geral" && <Overview project={project} tasks={tasks} budgets={budgets} plans={plans} />}
          {activeTab === "Pré-produção" && <PreProduction project={project} onChange={onChange} onSave={onSave} />}
          {activeTab === "Tarefas" && <LinkedItems title="Tarefas do projeto" href={`/tarefas?project=${encodeURIComponent(project.id)}`} action="Criar tarefa" icon={CheckSquare2} items={tasks.map((task) => ({ id: task.id, title: task.title, meta: task.status }))} />}
          {activeTab === "Orçamentos" && <LinkedItems title="Orçamentos vinculados" href={`/calculadora?project=${encodeURIComponent(project.id)}`} action="Criar orçamento" icon={WalletCards} items={budgets.map((budget) => ({ id: budget.id, title: budget.projectName, meta: `${budget.status} · ${formatCurrency(budget.finalValue)}` }))} />}
          {activeTab === "Planos de Filmagem" && <LinkedItems title="Planos de Filmagem vinculados" href={`/plano-de-filmagem?project=${encodeURIComponent(project.id)}`} action="Criar plano de filmagem" icon={CalendarClock} items={plans.map((plan) => ({ id: plan.id, title: plan.projectName, meta: `${plan.takeCount} takes · ${plan.completedCount} concluídos` }))} />}
          {activeTab === "Arquivos/Referências" && <ToolPanel title="Arquivos e referências" description="Área preparada para centralizar links, imagens e documentos do projeto." icon={FileImage} />}
        </main>
      </div>
    </div>
  );
}

function Overview({ project, tasks, budgets, plans }: { project: StudioProject; tasks: StudioTask[]; budgets: SavedBudget[]; plans: SavedFilmPlan[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="studio-card rounded-[28px] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase text-zinc-400">Visão geral</p>
        <h3 className="mt-4 text-2xl font-semibold text-zinc-950">{project.description || "Adicione uma descrição breve para orientar a equipe."}</h3>
        <div className="mt-8"><div className="flex justify-between text-sm font-semibold text-zinc-500"><span>Progresso</span><span>{project.progress}%</span></div><div className="mt-3 h-2 rounded-full bg-zinc-100"><div className="h-full rounded-full bg-zinc-950" style={{ width: `${project.progress}%` }} /></div></div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Tarefas" value={String(tasks.length)} /><Metric label="Pendentes" value={String(tasks.filter((task) => task.status !== "Concluída").length)} /><Metric label="Orçamentos" value={formatCurrency(budgets.reduce((sum, budget) => sum + budget.finalValue, 0))} /><Metric label="Planos" value={String(plans.length)} /></div>
      </section>
      <section className="studio-card rounded-[28px] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase text-zinc-400">Informações</p>
        <dl className="mt-5 space-y-4 text-sm"><Info label="Status" value={project.status} /><Info label="Prioridade" value={project.priority} /><Info label="Prazo" value={formatDate(project.deadline)} /><Info label="Tags" value={project.tags.join(", ") || "Sem tags"} /></dl>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-zinc-50 p-3"><p className="text-lg font-semibold text-zinc-950">{value}</p><p className="mt-1 text-xs text-zinc-400">{label}</p></div>;
}

function LinkedItems({ title, href, action, icon: Icon, items }: { title: string; href: string; action: string; icon: typeof LayoutDashboard; items: Array<{ id: string; title: string; meta: string }> }) {
  return <section className="studio-card rounded-[28px] p-6 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-950 text-white"><Icon size={19} /></span><h3 className="mt-5 text-2xl font-semibold text-zinc-950">{title}</h3></div><Link href={href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white">{action}<ArrowRight size={16} /></Link></div>{items.length ? <div className="mt-6 grid gap-3">{items.map((item) => <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4"><p className="font-semibold text-zinc-900">{item.title}</p><p className="mt-1 text-xs text-zinc-500">{item.meta}</p></div>)}</div> : <p className="mt-7 rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">Nenhum item vinculado ainda.</p>}</section>;
}

function PreProduction({ project, onChange, onSave }: { project: StudioProject; onChange: (project: StudioProject) => void; onSave: () => void }) {
  const update = (key: keyof StudioProject["preProduction"], value: string) => onChange({ ...project, preProduction: { ...project.preProduction, [key]: value } });
  const fields: Array<[keyof StudioProject["preProduction"], string, string]> = [
    ["centralIdea", "Ideia central", "A essência criativa do projeto"],
    ["objective", "Objetivo do projeto", "O resultado esperado"],
    ["audience", "Público-alvo", "Para quem esta produção será criada"],
    ["mainMessage", "Mensagem principal", "O que precisa permanecer após assistir"],
    ["visualReferences", "Referências visuais", "Links, filmes, campanhas ou direções visuais"],
    ["creativeNotes", "Observações criativas", "Decisões de linguagem, tom e estética"],
    ["deliverables", "Entregáveis previstos", "Formatos, versões e peças"],
    ["pendingItems", "Pendências de pré-produção", "Decisões e ações antes da gravação"],
  ];
  return (
    <section className="studio-card rounded-[28px] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase text-zinc-400">Pré-produção</p><h3 className="mt-3 text-2xl font-semibold text-zinc-950">Planejamento inicial</h3></div><button type="button" onClick={onSave} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white"><Save size={17} />Salvar pré-produção</button></div>
      <div className="mt-7 grid gap-4 md:grid-cols-2">{fields.map(([key, label, placeholder]) => <Field key={key} label={label}><TextArea value={project.preProduction[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="min-h-32" /></Field>)}</div>
    </section>
  );
}

function ToolPanel({ title, description, href, icon: Icon }: { title: string; description: string; href?: string; icon: typeof LayoutDashboard }) {
  return <section className="studio-card rounded-[28px] p-6 sm:p-10"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950 text-white"><Icon size={21} /></span><h3 className="mt-8 text-3xl font-semibold text-zinc-950">{title}</h3><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">{description}</p>{href ? <Link href={href} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white">Abrir ferramenta <ArrowRight size={17} /></Link> : <p className="mt-7 text-sm font-semibold text-zinc-400">Em preparação</p>}</section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-3"><dt className="text-zinc-400">{label}</dt><dd className="text-right font-semibold text-zinc-800">{value}</dd></div>;
}

function formatDate(value: string) {
  if (!value) return "A definir";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(year, month - 1, day));
}
