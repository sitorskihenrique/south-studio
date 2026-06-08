"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, LogOut, ShieldCheck, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { readLocalStorage, savedBudgetsStorageKey } from "@/lib/budget/storage";
import type { SavedBudget } from "@/lib/budget/types";
import { readFilmPlanStorage, savedFilmPlansKey } from "@/lib/film-plan/storage";
import type { SavedFilmPlan } from "@/lib/film-plan/types";
import { readTasks } from "@/lib/tasks/storage";
import type { StudioTask } from "@/lib/tasks/types";
import { replaceCloudItems } from "@/lib/supabase/data";

export function AccountSettings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

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

    const budgets = readLocalStorage<SavedBudget[]>(savedBudgetsStorageKey, []);
    const filmPlans = readFilmPlanStorage<SavedFilmPlan[]>(savedFilmPlansKey, []);
    const tasks = readTasks();

    const budgetResult = await replaceCloudItems("budgets", budgets, (item) => item.projectName || "Orçamento");
    const filmResult = await replaceCloudItems("film_plans", filmPlans, (item) => item.projectName || "Plano de filmagem");
    const taskResult = await replaceCloudItems("tasks", tasks, (item: StudioTask) => item.title || "Tarefa");

    setLoading(false);
    if ([budgetResult, filmResult, taskResult].every((result) => result.authenticated && result.ok)) {
      setMessage("Dados locais migrados para sua conta.");
    } else {
      setMessage("Não foi possível migrar tudo agora. Tente novamente em instantes.");
    }
  }

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:py-9">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Conta</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">Configurações</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">Gerencie seu acesso e leve os dados deste dispositivo para sua conta.</p>
        </header>

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
            <p className="mt-2 text-sm leading-6 text-zinc-500">Leva orçamentos, planos de filmagem e tarefas deste navegador para a sua conta.</p>
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
      </div>
    </section>
  );
}
