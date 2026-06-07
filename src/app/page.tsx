import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CalendarClock,
  CalendarDays,
  FileText,
  MonitorPlay,
  Sparkles,
  Timer,
  Video,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";

const stats = [
  { label: "Ferramentas ativas", value: "3", detail: "Primeira versão" },
  { label: "Textos salvos", value: "Local", detail: "No navegador" },
  { label: "Fluxo", value: "Rápido", detail: "Sem login" },
];

const cards = [
  {
    title: "Teleprompter",
    description: "Cole o roteiro, ajuste a leitura e grave com mais precisão.",
    href: "/teleprompter",
    icon: MonitorPlay,
    available: true,
  },
  {
    title: "Calculadora",
    description: "Precifique projetos com custos, margens e lucro em tempo real.",
    href: "/calculadora",
    icon: Calculator,
    available: true,
  },
  {
    title: "Plano de Filmagem",
    description: "Centralize ordem do dia, shotlist, takes e referências visuais.",
    href: "/plano-de-filmagem",
    icon: CalendarClock,
    available: true,
  },
];

export default function Dashboard() {
  return (
    <AppShell>
      <section className="h-full overflow-y-auto px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm">
                <Sparkles size={14} />
                Studio hub
              </div>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
                Ferramentas limpas para sets mais fluidos.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">
                Centralize recursos essenciais de produção audiovisual em uma
                interface rápida, minimalista e pronta para o dia a dia.
              </p>
            </div>

            <Link
              href="/teleprompter"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-zinc-950/15 transition hover:-translate-y-0.5 hover:bg-zinc-800"
            >
              Abrir teleprompter
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-white/75 bg-white/70 p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-zinc-500">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 md:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className={`group rounded-[28px] border border-white/75 bg-white/74 p-5 shadow-sm transition ${
                      card.available
                        ? "hover:-translate-y-1 hover:shadow-soft"
                        : "cursor-default opacity-70"
                    }`}
                  >
                    <div className="mb-8 flex items-start justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500/12 text-teal-700">
                        <Icon size={23} />
                      </span>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                        {card.available ? "Disponível" : "Em breve"}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      {card.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                      {card.description}
                    </p>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-[28px] border border-white/75 bg-zinc-950 p-6 text-white shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-teal-200">
                  <Video size={23} />
                </span>
                <div>
                  <p className="text-sm text-zinc-400">Hoje no estúdio</p>
                  <h2 className="text-xl font-semibold">Roteiro pronto</h2>
                </div>
              </div>
              <p className="mt-8 text-4xl font-semibold tracking-tight">
                Comece pelo texto.
              </p>
              <p className="mt-4 text-sm leading-6 text-zinc-300">
                A primeira versão foca no teleprompter: leitura ajustável,
                espelhamento e salvamento local para retomadas rápidas.
              </p>
              <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/8 p-4">
                <Timer className="text-teal-200" size={20} />
                <span className="text-sm font-medium text-zinc-200">
                  Sem cadastro, sem banco, sem fricção.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
