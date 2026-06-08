import Link from "next/link";
import { ArrowRight, Calculator, CalendarClock, CheckSquare2, FolderKanban, Play } from "lucide-react";

const tools = [
  { title: "Orçamentos", description: "Custo, margem e proposta com leitura clara.", icon: Calculator },
  { title: "Filmagem", description: "Takes, roteiro, timeline e referências no mesmo plano.", icon: CalendarClock },
  { title: "Tarefas", description: "Semana, prioridades e execução sem ruído.", icon: CheckSquare2 },
  { title: "Projetos", description: "Clientes, prazos e status em visão de produção.", icon: FolderKanban },
];

const frames = [
  "from-zinc-900 via-zinc-700 to-stone-400",
  "from-red-950 via-zinc-900 to-stone-700",
  "from-stone-200 via-zinc-500 to-zinc-950",
  "from-slate-950 via-cyan-950 to-stone-600",
  "from-zinc-800 via-neutral-500 to-amber-200",
  "from-stone-900 via-red-900 to-zinc-950",
];

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#111] text-white">
      <section className="cinematic-noise relative flex min-h-[100dvh] flex-col">
        <div className="absolute inset-0 opacity-80">
          <div className="grid h-full min-w-[980px] rotate-[-8deg] scale-110 grid-cols-6 gap-3 p-8 blur-[0.2px] sm:gap-4 sm:p-12">
            {frames.map((frame, index) => (
              <div
                key={frame}
                className={`rounded-[28px] bg-gradient-to-br ${frame} shadow-2xl shadow-black/40 ${
                  index % 3 === 0 ? "row-span-2" : ""
                } ${index === 1 || index === 4 ? "col-span-2" : ""}`}
              >
                <div className="h-full rounded-[28px] bg-[radial-gradient(circle_at_45%_25%,rgba(255,255,255,0.45),transparent_18%),linear-gradient(to_bottom,transparent,rgba(0,0,0,0.58))]" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,0,0,0.18),rgba(0,0,0,0.82)_58%,rgba(0,0,0,0.96)_100%)]" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-sm font-semibold text-zinc-950">S</span>
            <span className="text-sm font-semibold tracking-tight">South Studio</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden min-h-11 items-center rounded-full border border-white/15 bg-white/8 px-5 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-white/14 sm:inline-flex">
              Login
            </Link>
            <Link href="/cadastro" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
              Faça parte <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 pb-8 pt-16 sm:px-8 lg:pb-10">
          <div className="max-w-5xl fade-in">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur">
              <Play size={13} />
              Studio OS
            </p>
            <h1 className="max-w-5xl text-5xl font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
              O sistema operacional da produção audiovisual.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">
              Da pré à entrega: organize orçamento, plano, tarefas e projetos em um fluxo claro, rápido e cinematográfico.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200">
                Começar agora <ArrowRight size={17} />
              </Link>
              <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/18 bg-white/8 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/14">
                Já tenho conta
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div key={tool.title} className="rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/12">
                  <Icon size={18} className="text-white/70" />
                  <h2 className="mt-5 text-base font-semibold text-white">{tool.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/56">{tool.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
