"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  CalendarDays,
  Clapperboard,
  Grid2X2,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  WalletCards,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";

const navigationGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", detail: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
      { label: "Projetos", detail: "Gerencie sua carteira", href: "/projetos", icon: Grid2X2 },
      { label: "Calendário", detail: "Prazos e entregas", href: "/tarefas?view=calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Produção",
    items: [
      { label: "Tarefas", detail: "Pendências do dia", href: "/tarefas", icon: ListChecks },
      { label: "Roteiros", detail: "Produções planejadas", href: "/plano-de-filmagem", icon: Clapperboard },
    ],
  },
  {
    label: "Financeiro",
    items: [{ label: "Orçamentos", detail: "Valores e contratos", href: "/calculadora", icon: WalletCards }],
  },
  {
    label: "Sistema",
    items: [{ label: "Configurações", detail: "Conta e aplicativo", href: "/configuracoes", icon: Settings }],
  },
];

export function StudioSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const calendarView = pathname === "/tarefas" && searchParams.get("view") === "calendar";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, searchParams]);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return router.push("/login");
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
    <aside className="hidden min-h-0 rounded-[26px] border border-white/80 bg-white/60 p-3 shadow-[0_22px_70px_rgba(16,24,40,0.09)] backdrop-blur-2xl sm:rounded-[30px] lg:grid lg:h-full lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:p-4">
      <Link href="/dashboard" className="flex min-h-16 items-center justify-center rounded-[18px] border border-white/70 bg-white/46 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_10px_30px_rgba(15,20,32,0.05)]">
        <BrandLogo tone="dark" className="w-[148px]" priority />
      </Link>

      <nav className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 lg:mt-5 lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-3 lg:pr-1">
        {navigationGroups.map((group) => (
          <div key={group.label} className="contents lg:block">
            <p className="mb-2 mt-5 hidden px-3 text-[10px] font-bold uppercase text-zinc-400 first:mt-0 lg:block">{group.label}</p>
            <div className="contents lg:flex lg:flex-col lg:gap-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const calendarActive = item.label === "Calendário" && pathname === "/tarefas" && calendarView;
                const tasksActive = item.label === "Tarefas" && pathname === "/tarefas" && !calendarView;
                const active = calendarActive || tasksActive || (item.label !== "Calendário" && item.label !== "Tarefas" && pathname === item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group relative flex min-w-[190px] cursor-pointer items-center gap-3 overflow-hidden rounded-[18px] border px-3 py-2.5 transition duration-300 before:pointer-events-none before:absolute before:inset-y-0 before:left-[-45%] before:w-1/3 before:skew-x-[-18deg] before:bg-gradient-to-r before:from-transparent before:via-white/75 before:to-transparent before:opacity-0 before:transition-all before:duration-500 hover:-translate-y-0.5 hover:border-white hover:bg-white/82 hover:shadow-[0_14px_34px_rgba(18,24,36,0.11)] hover:before:left-[120%] hover:before:opacity-70 lg:min-w-0 ${
                      active ? "border-white bg-white/94 shadow-[0_13px_32px_rgba(16,24,40,0.12)]" : "border-white/50 bg-white/30"
                    }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] ${active ? "bg-[#0b0e15] text-white" : "text-zinc-600"}`}>
                      <Icon size={20} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-zinc-950">{item.label}</span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-zinc-500">{item.detail}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-2 hidden rounded-[20px] border border-white/75 bg-white/54 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] lg:block">
        <p className="truncate text-sm font-semibold text-zinc-900">{displayName(user)}</p>
        <p className="mt-1 truncate text-xs leading-5 text-zinc-500">{user?.email || "Conta Cologne"}</p>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0b0e15] px-3 text-xs font-semibold text-white transition hover:bg-[#171b25] disabled:opacity-60"
        >
          <LogOut size={15} />
          {signingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    </aside>

    {mobileMenuOpen && (
      <div className="fixed inset-0 z-[90] bg-black/28 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
        <div
          className="absolute inset-x-3 bottom-[calc(5.4rem+env(safe-area-inset-bottom))] rounded-[24px] border border-white/80 bg-white/92 p-3 shadow-[0_28px_80px_rgba(10,14,24,0.24)] backdrop-blur-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between px-2 py-1">
            <BrandLogo tone="dark" className="w-[126px]" />
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu" className="grid h-11 w-11 place-items-center rounded-full bg-zinc-100 text-zinc-700">
              <X size={19} />
            </button>
          </div>
          <div className="grid gap-1.5">
            <MobileMenuLink href="/tarefas?view=calendar" label="Calendário" detail="Prazos e entregas" icon={CalendarDays} />
            <MobileMenuLink href="/plano-de-filmagem" label="Roteiros" detail="Planos de filmagem" icon={Clapperboard} />
            <MobileMenuLink href="/configuracoes" label="Configurações" detail="Conta e aplicativo" icon={Settings} />
          </div>
          <button type="button" onClick={signOut} disabled={signingOut} className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b0e15] px-4 text-sm font-semibold text-white disabled:opacity-60">
            <LogOut size={17} />{signingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    )}

    <nav className="fixed inset-x-3 bottom-[max(0.6rem,env(safe-area-inset-bottom))] z-[100] grid grid-cols-5 rounded-[22px] border border-white/80 bg-white/88 p-1.5 shadow-[0_18px_55px_rgba(10,14,24,0.2)] backdrop-blur-2xl lg:hidden" aria-label="Navegação principal">
      <MobileNavLink href="/dashboard" label="Início" icon={LayoutDashboard} active={pathname === "/dashboard"} />
      <MobileNavLink href="/projetos" label="Projetos" icon={Grid2X2} active={pathname === "/projetos"} />
      <MobileNavLink href="/tarefas" label="Tarefas" icon={ListChecks} active={pathname === "/tarefas" && !calendarView} />
      <MobileNavLink href="/calculadora" label="Orçamentos" icon={WalletCards} active={pathname === "/calculadora"} />
      <button type="button" onClick={() => setMobileMenuOpen(true)} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-[17px] px-1 text-[10px] font-semibold ${mobileMenuOpen || ["/plano-de-filmagem", "/configuracoes"].includes(pathname) || calendarView ? "bg-[#0b0e15] text-white" : "text-zinc-500"}`}>
        <Menu size={20} /><span className="max-w-full truncate">Mais</span>
      </button>
    </nav>
    </>
  );
}

function MobileNavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean }) {
  return (
    <Link href={href} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-[17px] px-1 text-[10px] font-semibold ${active ? "bg-[#0b0e15] text-white" : "text-zinc-500"}`}>
      <Icon size={20} /><span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

function MobileMenuLink({ href, label, detail, icon: Icon }: { href: string; label: string; detail: string; icon: typeof LayoutDashboard }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 rounded-[17px] border border-zinc-100 bg-white px-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-zinc-100 text-zinc-700"><Icon size={19} /></span>
      <span className="min-w-0"><span className="block text-sm font-semibold text-zinc-900">{label}</span><span className="block truncate text-xs text-zinc-500">{detail}</span></span>
    </Link>
  );
}

function displayName(user: User | null) {
  const metadata = user?.user_metadata ?? {};
  const name = typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : "";
  return name.trim() || user?.email?.split("@")[0] || "Usuário";
}
