import Link from "next/link";
import { ArrowRight, Calculator, CalendarClock, CheckSquare2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DashboardTasks } from "@/components/tasks/DashboardTasks";

const tools = [
  { title: "Calculadora", description: "Precifique projetos com custos, margens e lucro em tempo real.", href: "/calculadora", icon: Calculator, color: "bg-teal-50 text-teal-700" },
  { title: "Plano de Filmagem", description: "Centralize ordem do dia, shotlist, takes e referências visuais.", href: "/plano-de-filmagem", icon: CalendarClock, color: "bg-violet-50 text-violet-700" },
  { title: "Tarefas", description: "Organize demandas de produção e acompanhe sua semana.", href: "/tarefas", icon: CheckSquare2, color: "bg-amber-50 text-amber-700" },
];

export default function Dashboard() {
  return (
    <AppShell>
      <section className="h-full overflow-y-auto px-4 py-5 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1320px] space-y-6">
          <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 hidden items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm sm:inline-flex"><Sparkles size={14} />Studio hub</div>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">Produção organizada, da ideia à entrega.</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">Acompanhe a semana, planeje gravações e mantenha seus orçamentos em um só lugar.</p>
            </div>
            <Link href="/tarefas" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-xl shadow-zinc-950/15 sm:w-fit">Ver tarefas <ArrowRight size={17} /></Link>
          </header>

          <DashboardTasks />

          <section>
            <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Ferramentas</p><h2 className="mt-2 text-xl font-semibold text-zinc-950">Fluxo South Studio</h2></div>
            <div className="grid gap-3 md:grid-cols-3">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.href} href={tool.href} className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft sm:rounded-3xl">
                    <div className="flex items-start justify-between gap-3"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${tool.color}`}><Icon size={22} /></span><ArrowRight className="text-zinc-300 transition group-hover:translate-x-1 group-hover:text-zinc-700" size={18} /></div>
                    <h3 className="mt-6 text-lg font-semibold text-zinc-950">{tool.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">{tool.description}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
