import Link from "next/link";
import { ArrowRight, Calculator, CalendarClock, CheckSquare2, FolderKanban, Layers3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DashboardTasks } from "@/components/tasks/DashboardTasks";

const tools = [
  {
    title: "Calculadora",
    kicker: "Orçar",
    description: "Propostas com margem, imposto e lucro em leitura executiva.",
    href: "/calculadora",
    icon: Calculator,
  },
  {
    title: "Plano de Filmagem",
    kicker: "Dirigir",
    description: "Shotlist, takes, imagens e timeline em um plano visual.",
    href: "/plano-de-filmagem",
    icon: CalendarClock,
  },
  {
    title: "Tarefas",
    kicker: "Executar",
    description: "Prioridades da semana com foco no que move a produção.",
    href: "/tarefas",
    icon: CheckSquare2,
  },
  {
    title: "Projetos",
    kicker: "Centralizar",
    description: "Clientes, status, prazos e progresso por produção.",
    href: "/projetos",
    icon: FolderKanban,
  },
];

export default function Dashboard() {
  return (
    <AppShell>
      <section className="h-full overflow-y-auto px-4 py-5 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1320px] space-y-6 fade-in">
          <header className="studio-card rounded-[32px] p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-500">
                  <Layers3 size={14} />
                  Studio OS
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <h1 className="text-5xl font-semibold text-zinc-950 sm:text-7xl">South Studio</h1>
                  <span className="rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-500">beta</span>
                </div>
                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
                  O sistema operacional da produção audiovisual. Tudo da pré à entrega, com o mínimo de atrito.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href="/projetos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800">
                  Abrir projetos <ArrowRight size={17} />
                </Link>
                <Link href="/tarefas" className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950">
                  Ver semana
                </Link>
              </div>
            </div>
          </header>

          <DashboardTasks />

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-500">Fluxo de trabalho</p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-950">Da pré à entrega</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.href} href={tool.href} className="studio-card group min-h-[230px] rounded-[28px] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-zinc-500">{tool.kicker}</span>
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-950 text-white"><Icon size={19} /></span>
                    </div>
                    <div className="mt-20">
                      <h3 className="text-2xl font-semibold text-zinc-950">{tool.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-500">{tool.description}</p>
                    </div>
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
