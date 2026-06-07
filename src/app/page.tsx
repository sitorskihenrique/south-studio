import Link from "next/link";
import { ArrowRight, Calculator, CalendarClock, CheckSquare2, LockKeyhole, Sparkles } from "lucide-react";

const tools = [
  { title: "Calculadora", description: "Orçamentos com custos, margem, impostos e lucro.", icon: Calculator },
  { title: "Plano de Filmagem", description: "Shotlist, cronograma, takes e referências visuais.", icon: CalendarClock },
  { title: "Tarefas", description: "Demandas semanais por prioridade, tempo e status.", icon: CheckSquare2 },
];

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-zinc-100 text-zinc-950">
      <section className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-950 text-lg font-semibold text-white shadow-lg shadow-zinc-950/15">S</span>
            <span>
              <span className="block text-base font-semibold">South Studio</span>
              <span className="text-xs font-medium text-zinc-500">Produção audiovisual</span>
            </span>
          </Link>
          <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700">Entrar</Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm"><Sparkles size={14} />Ferramentas para produtoras e videomakers</div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">Organize produção, orçamento e rotina em um só lugar.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600">O South Studio reúne calculadora, plano de filmagem e tarefas semanais com login, banco de dados por usuário e estrutura pronta para crescer.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-xl shadow-zinc-950/15">Criar conta <ArrowRight size={17} /></Link>
              <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700">Já tenho conta</Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/75 bg-white/78 p-4 shadow-soft sm:p-5">
            <div className="rounded-2xl bg-zinc-950 p-5 text-white">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-teal-200"><LockKeyhole size={21} /></span><div><p className="text-sm text-zinc-400">Área protegida</p><h2 className="text-lg font-semibold">Dados por usuário</h2></div></div>
              <p className="mt-8 text-sm leading-6 text-zinc-300">Cada conta acessa apenas seus próprios orçamentos, planos, tarefas e projetos via Supabase Row Level Security.</p>
            </div>
            <div className="mt-4 grid gap-3">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div key={tool.title} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-700"><Icon size={20} /></span>
                    <div><h3 className="text-sm font-semibold text-zinc-900">{tool.title}</h3><p className="mt-1 text-xs leading-5 text-zinc-500">{tool.description}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
