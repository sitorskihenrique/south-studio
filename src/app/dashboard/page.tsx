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
    tone: "from-emerald-300/24 to-zinc-950",
  },
  {
    title: "Plano de Filmagem",
    kicker: "Dirigir",
    description: "Shotlist, takes, imagens e timeline em um plano visual.",
    href: "/plano-de-filmagem",
    icon: CalendarClock,
    tone: "from-sky-300/24 to-zinc-950",
  },
  {
    title: "Tarefas",
    kicker: "Executar",
    description: "Prioridades da semana com foco no que move a produção.",
    href: "/tarefas",
    icon: CheckSquare2,
    tone: "from-amber-300/24 to-zinc-950",
  },
  {
    title: "Projetos",
    kicker: "Centralizar",
    description: "Clientes, status, prazos e progresso por produção.",
    href: "/projetos",
    icon: FolderKanban,
    tone: "from-rose-300/24 to-zinc-950",
  },
];

export default function Dashboard() {
  return (
    <AppShell>
      <section className="h-full overflow-y-auto px-4 py-5 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1380px] space-y-6 fade-in">
          <header className="relative overflow-hidden rounded-[32px] bg-zinc-950 p-6 text-white shadow-2xl shadow-zinc-950/20 sm:p-8 lg:p-10">
            <div className="absolute inset-0 opacity-70">
              <div className="grid h-full rotate-[-6deg] scale-125 grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className={`rounded-[28px] bg-gradient-to-br ${index % 2 ? "from-white/20 to-white/0" : "from-red-400/20 to-cyan-300/0"}`} />
                ))}
              </div>
            </div>
            <div className="relative max-w-4xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/64 backdrop-blur">
                <Layers3 size={14} />
                South Studio
              </p>
              <h1 className="mt-8 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Produção sem ruído.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/62">
                Planeje, orce e execute com clareza. Tudo da produção em um só lugar.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/projetos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
                  Abrir projetos <ArrowRight size={17} />
                </Link>
                <Link href="/tarefas" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/16 bg-white/8 px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/14">
                  Ver semana
                </Link>
              </div>
            </div>
          </header>

          <DashboardTasks />

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Fluxo de trabalho</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">Da pré à entrega</h2>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.href} href={tool.href} className="group overflow-hidden rounded-[28px] bg-zinc-950 text-white shadow-xl shadow-zinc-950/8 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-950/14">
                    <div className={`min-h-[220px] bg-gradient-to-br ${tool.tone} p-5`}>
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/64">{tool.kicker}</span>
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-zinc-950 transition group-hover:scale-105"><Icon size={19} /></span>
                      </div>
                      <div className="mt-16">
                        <h3 className="text-2xl font-semibold tracking-tight">{tool.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-white/62">{tool.description}</p>
                      </div>
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
