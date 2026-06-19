"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Cloud, CloudUpload, Clock3, LogOut, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { importMissingLocalCollections } from "@/lib/supabase/migrate-local";
import { InstallApp } from "@/components/pwa/InstallApp";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { cloudSyncEvent, getCloudSyncSnapshot, readCloudItems } from "@/lib/supabase/data";
import type { StudioTask } from "@/lib/tasks/types";

export function AccountSettings() {
  const router = useRouter();
  const { user } = useAuthSession();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSync, setCheckingSync] = useState(false);
  const [cloudOnline, setCloudOnline] = useState<boolean | null>(null);
  const [syncState, setSyncState] = useState({ pending: 0, lastSyncedAt: "" });

  useEffect(() => {
    if (!user) return;
    const refreshSnapshot = () => setSyncState(getCloudSyncSnapshot(user.id));
    refreshSnapshot();
    window.addEventListener(cloudSyncEvent, refreshSnapshot);
    window.addEventListener("online", refreshSnapshot);
    return () => {
      window.removeEventListener(cloudSyncEvent, refreshSnapshot);
      window.removeEventListener("online", refreshSnapshot);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setCheckingSync(true);
    readCloudItems<StudioTask>("tasks", { force: true }).then((result) => {
      if (!active) return;
      setCloudOnline(result.authenticated && result.ok);
      setSyncState(getCloudSyncSnapshot(user.id));
      setCheckingSync(false);
    });
    return () => { active = false; };
  }, [user]);

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

  async function checkCloud() {
    setCheckingSync(true);
    const result = await readCloudItems<StudioTask>("tasks", { force: true });
    setCloudOnline(result.authenticated && result.ok);
    if (user) setSyncState(getCloudSyncSnapshot(user.id));
    setCheckingSync(false);
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
            <p className="mt-2 text-sm leading-6 text-zinc-500">Importa apenas projetos, orçamentos, planos e tarefas deste navegador que já pertencem à conta atual e ainda não existem na nuvem.</p>
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

        <section className="studio-card mt-4 rounded-[28px] p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-400">Status beta</p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-950">Sincronização da conta</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">A nuvem é a fonte principal. Alterações sem conexão ficam na fila deste dispositivo até o próximo envio.</p>
            </div>
            <button type="button" onClick={checkCloud} disabled={checkingSync} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 disabled:opacity-60">
              <RefreshCw size={16} className={checkingSync ? "animate-spin" : ""} />Verificar
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatusItem icon={Cloud} label="Supabase" value={cloudOnline === null ? "Verificando" : cloudOnline ? "Conectado" : "Indisponível"} positive={cloudOnline === true} />
            <StatusItem icon={Clock3} label="Última sync" value={formatSyncDate(syncState.lastSyncedAt)} positive={Boolean(syncState.lastSyncedAt)} />
            <StatusItem icon={CheckCircle2} label="Fila pendente" value={syncState.pending ? `${syncState.pending} item(ns)` : "Tudo enviado"} positive={!syncState.pending} />
          </div>
          <p className="mt-4 text-xs text-zinc-400">Versão beta · usuário {user?.email || "não identificado"}</p>
        </section>
        <InstallApp />
      </div>
    </section>
  );
}

function StatusItem({ icon: Icon, label, value, positive }: { icon: LucideIcon; label: string; value: string; positive: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <Icon size={18} className={positive ? "text-emerald-600" : "text-zinc-400"} />
      <p className="mt-3 text-xs font-semibold uppercase text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-800">{value}</p>
    </div>
  );
}

function formatSyncDate(value: string) {
  if (!value) return "Ainda não registrada";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Ainda não registrada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
