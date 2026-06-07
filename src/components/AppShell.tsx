"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, CalendarClock, CheckSquare2, Clapperboard, FolderKanban, LayoutDashboard, Settings } from "lucide-react";
import { InstallApp } from "@/components/pwa/InstallApp";

const navigation = [
  { href: "/", label: "Início", desktopLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/calculadora", label: "Calcular", desktopLabel: "Calculadora", icon: Calculator },
  { href: "/plano-de-filmagem", label: "Filmagem", desktopLabel: "Plano de Filmagem", icon: CalendarClock },
  { href: "/tarefas", label: "Tarefas", desktopLabel: "Tarefas", icon: CheckSquare2 },
];

const desktopOnlyNavigation = [
  { href: "#projetos", label: "Projetos", icon: FolderKanban },
  { href: "#configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100dvh] bg-zinc-100 text-zinc-950 lg:p-5">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1600px] flex-col bg-white/60 lg:min-h-[calc(100dvh-40px)] lg:flex-row lg:overflow-hidden lg:rounded-[28px] lg:border lg:border-white/70 lg:shadow-soft lg:backdrop-blur-2xl">
        <header className="border-b border-zinc-200/80 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <span>
              <span className="block text-base font-semibold leading-tight">South Studio</span>
              <span className="text-xs font-medium text-zinc-500">Produção audiovisual</span>
            </span>
          </Link>
          <InstallApp />
        </header>

        <aside className="hidden w-72 shrink-0 flex-col border-r border-zinc-200/70 bg-white/72 px-5 py-6 lg:flex">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <span>
              <span className="block text-base font-semibold leading-tight">South Studio</span>
              <span className="text-xs font-medium text-zinc-500">Produção audiovisual</span>
            </span>
          </Link>

          <nav className="mt-9 flex flex-col gap-2">
            {navigation.map((item) => <DesktopLink key={item.href} item={item} active={pathname === item.href} />)}
            {desktopOnlyNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} aria-disabled onClick={(event) => event.preventDefault()} className="flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-zinc-600 opacity-45">
                  <Icon size={18} />{item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto"><InstallApp /></div>
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-[80] grid grid-cols-4 border-t border-zinc-200/80 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold ${active ? "bg-zinc-950 text-white" : "text-zinc-500"}`}>
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
  return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/15"><Clapperboard size={22} /></span>;
}

function DesktopLink({ item, active }: { item: (typeof navigation)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/10" : "text-zinc-600 hover:bg-white hover:text-zinc-950"}`}>
      <Icon size={18} />{item.desktopLabel}
    </Link>
  );
}
