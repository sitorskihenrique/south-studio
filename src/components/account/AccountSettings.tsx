"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { importMissingLocalCollections } from "@/lib/supabase/migrate-local";
import { InstallApp } from "@/components/pwa/InstallApp";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { ToolHeader } from "@/components/ui/ToolHeader";

export function AccountSettings() {
  const router = useRouter();
  const { user } = useAuthSession();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return router.push("/login");
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function migrateLocalData() {
    setLoading(true);
    setMessage("");

    const result = await importMissingLocalCollections();

    setLoading(false);
    if (result.authenticated && result.ok) {
      setMessage(result.imported
        ? `${result.imported} item(ns) local(is) importado(s) para sua conta.`
        : "Sua conta já está sincronizada.");
    } else {
      setMessage("Não foi possível migrar tudo agora. Tente novamente em instantes.");
    }
  }

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-9">
        <ToolHeader
          eyebrow="Sistema"
          title="Configurações"
          description="Gerencie seu acesso, instalação e sincronização de dados com sua conta."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="studio-card rounded-[28px] p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-950 text-white"><UserRound size={22} /></span>
            <h2 className="mt-5 text-xl font-semibold text-zinc-950">Usuário logado</h2>
            <p className="mt-2 break-all text-sm font-medium text-zinc-700">{user?.email || "Carregando conta..."}</p>
            {user?.user_metadata?.full_name && <p className="mt-1 text-sm text-zinc-500">{user.user_metadata.full_name}</p>}
            <button type="button" onClick={signOut} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white">
              <LogOut size={17} />Sair
            </button>
          </section>

          <section className="studio-card rounded-[28px] p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><CloudUpload size={22} /></span>
            <h2 className="mt-5 text-xl font-semibold text-zinc-950">Migrar dados locais</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Importa projetos, orçamentos, planos e tarefas deste navegador que ainda não existem na sua conta.</p>
            <button type="button" onClick={migrateLocalData} disabled={loading} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 disabled:opacity-60">
              <CloudUpload size={17} />{loading ? "Migrando..." : "Migrar dados locais para minha conta"}
            </button>
            {message && <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{message}</p>}
          </section>
        </div>

        <div className="studio-card mt-4 rounded-[28px] p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={19} /></span>
            <div>
              <h2 className="text-base font-semibold text-zinc-950">Privacidade da conta</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Seu espaço de trabalho é individual e mantém seus projetos separados por conta.</p>
            </div>
          </div>
        </div>
        <InstallApp />
      </div>
    </section>
  );
}
