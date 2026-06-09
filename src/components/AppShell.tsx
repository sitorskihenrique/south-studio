"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calculator, CalendarClock, CheckSquare2, FolderKanban, LayoutDashboard, LogOut, Settings, Sparkles } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { InstallApp } from "@/components/pwa/InstallApp";
import { LoggedUserCard } from "@/components/auth/LoggedUserCard";
import { createClient } from "@/lib/supabase/client";
import { BetaNotice } from "@/components/BetaNotice";

const navigation = [
  { href: "/dashboard", label: "Home", desktopLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/calculadora", label: "Orçar", desktopLabel: "Calculadora", icon: Calculator },
  { href: "/plano-de-filmagem", label: "Plano", desktopLabel: "Plano de Filmagem", icon: CalendarClock },
  { href: "/tarefas", label: "Tarefas", desktopLabel: "Tarefas", icon: CheckSquare2 },
  { href: "/projetos", label: "Projetos", desktopLabel: "Projetos", icon: FolderKanban },
];

const desktopOnlyNavigation = [
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return router.push("/login");
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="studio-shell h-[100dvh] overflow-hidden text-zinc-950 lg:p-4 xl:p-5">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col overflow-hidden bg-white/65 lg:flex-row lg:rounded-[32px] lg:border lg:border-zinc-200 lg:shadow-[0_18px_70px_rgba(15,15,15,0.08)]">
        <header className="z-50 shrink-0 border-b border-zinc-200/70 bg-white/94 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
              <BrandMark />
              <span className="min-w-0">
                <span className="flex items-center gap-2 truncate text-base font-semibold leading-tight">South Studio <BetaBadge /></span>
                <span className="block truncate text-xs font-medium text-zinc-500">{user?.email || "Workflow audiovisual"}</span>
              </span>
            </Link>
            <button type="button" onClick={signOut} disabled={signingOut} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-zinc-950 text-white shadow-lg shadow-zinc-950/10" aria-label="Sair">
              <LogOut size={18} />
            </button>
          </div>
          <InstallApp />
        </header>

        <aside className="hidden h-full w-[264px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-zinc-950 px-4 py-5 text-white lg:flex">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-3xl px-2 py-2">
            <BrandMark />
            <span>
              <span className="flex items-center gap-2 text-base font-semibold leading-tight">South Studio <BetaBadge /></span>
              <span className="text-xs font-medium text-zinc-500">Workflow audiovisual</span>
            </span>
          </Link>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              <Sparkles size={14} />
              Studio OS
            </div>
            <p className="mt-3 text-sm leading-5 text-zinc-300">Da pré à entrega, tudo em fluxo.</p>
          </div>

          <nav className="mt-5 flex flex-col gap-1.5">
            {navigation.map((item) => <DesktopLink key={item.href} item={item} active={pathname === item.href} />)}
            {desktopOnlyNavigation.map((item) => <DesktopLink key={item.href} item={{ ...item, desktopLabel: item.label }} active={pathname === item.href} />)}
          </nav>

          <div className="mt-auto space-y-4">
            <LoggedUserCard user={user} signingOut={signingOut} onSignOut={signOut} />
            <InstallApp />
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
        <BetaNotice />

        <nav className="z-[80] grid shrink-0 grid-cols-5 border-t border-zinc-200/70 bg-white/96 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_34px_rgba(0,0,0,0.08)] lg:hidden">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition ${active ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/15" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"}`}>
                <Icon size={20} /><span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function BrandMark() {
  return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-semibold text-zinc-950 shadow-lg shadow-black/10">S</span>;
}

function BetaBadge() {
  return <span className="rounded-full border border-zinc-300/70 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">beta</span>;
}

function DesktopLink({ item, active }: { item: { href: string; desktopLabel: string; icon: typeof LayoutDashboard }; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition ${active ? "bg-white text-zinc-950 shadow-lg shadow-black/20" : "text-zinc-400 hover:bg-white/8 hover:text-white"}`}>
      <Icon size={18} />{item.desktopLabel}
    </Link>
  );
}
