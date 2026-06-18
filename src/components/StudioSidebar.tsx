"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clapperboard,
  Grid2X2,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  WalletCards,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { label: "Dashboard", detail: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projetos", detail: "Gerencie sua carteira", href: "/projetos", icon: Grid2X2 },
  { label: "Tarefas", detail: "Pendências do dia", href: "/tarefas", icon: ListChecks },
  { label: "Orçamentos", detail: "Valores e contratos", href: "/calculadora", icon: WalletCards },
  { label: "Roteiros", detail: "Produções planejadas", href: "/plano-de-filmagem", icon: Clapperboard },
  { label: "Calendário", detail: "Prazos e entregas", href: "/tarefas?view=calendar", icon: CalendarDays },
  { label: "Configurações", detail: "Conta e aplicativo", href: "/configuracoes", icon: Settings },
];

export function StudioSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [calendarView, setCalendarView] = useState(false);

  useEffect(() => {
    setCalendarView(pathname === "/tarefas" && new URLSearchParams(window.location.search).get("view") === "calendar");
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
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
    <aside className="rounded-[30px] border border-white/75 bg-white/56 p-4 shadow-[0_22px_70px_rgba(16,24,40,0.08)] backdrop-blur-2xl lg:flex lg:min-h-[calc(100dvh-3rem)] lg:flex-col lg:p-5">
      <Link href="/dashboard" className="block px-1 py-2">
        <span className="text-[21px] font-black uppercase text-zinc-950">South Studio</span>
        <span className="align-super text-[9px] font-black">TM</span>
      </Link>

      <nav className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2 lg:mt-8 lg:flex-col lg:overflow-visible lg:pb-0">
        {navigation.map((item) => {
          const Icon = item.icon;
          const calendarActive = item.label === "Calendário" && pathname === "/tarefas" && calendarView;
          const tasksActive = item.label === "Tarefas" && pathname === "/tarefas" && !calendarView;
          const active = calendarActive || tasksActive || (item.label !== "Calendário" && item.label !== "Tarefas" && pathname === item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex min-w-[196px] items-center gap-3 rounded-[20px] border px-3 py-3 transition lg:min-w-0 ${
                active
                  ? "border-white bg-white/90 shadow-[0_14px_38px_rgba(16,24,40,0.09)]"
                  : "border-white/45 bg-white/34 hover:bg-white/72"
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${active ? "bg-[#121824] text-white" : "text-zinc-600"}`}>
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-zinc-950">{item.label}</span>
                <span className="mt-0.5 block truncate text-xs font-medium text-zinc-500">{item.detail}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 hidden rounded-[22px] border border-white/60 bg-white/45 p-3 lg:mt-auto lg:block">
        <p className="truncate text-sm font-semibold text-zinc-900">{displayName(user)}</p>
        <p className="mt-1 truncate text-xs text-zinc-500">{user?.email || "Conta South Studio"}</p>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#121824] px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          <LogOut size={15} />
          {signingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    </aside>
  );
}

function displayName(user: User | null) {
  const metadata = user?.user_metadata ?? {};
  const name = typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : "";
  return name.trim() || user?.email?.split("@")[0] || "Usuário";
}
