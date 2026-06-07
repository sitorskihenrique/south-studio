import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function ProjectsPage() {
  return (
    <AppShell>
      <section className="h-full overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Produção</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Projetos</h1>
          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <FolderKanban size={32} className="mx-auto text-zinc-400" />
            <h2 className="mt-4 text-xl font-semibold text-zinc-950">Base pronta para projetos</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">A tabela `projects` já está prevista no Supabase para conectar orçamentos, planos e tarefas por cliente no próximo ciclo.</p>
            <Link href="/dashboard" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white"><Plus size={17} />Voltar ao dashboard</Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
