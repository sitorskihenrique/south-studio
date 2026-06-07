"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  CalendarClock,
  Clapperboard,
  FolderKanban,
  LayoutDashboard,
  MonitorPlay,
  Settings,
} from "lucide-react";
import { InstallApp } from "@/components/pwa/InstallApp";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teleprompter", label: "Teleprompter", icon: MonitorPlay },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/plano-de-filmagem", label: "Plano de Filmagem", icon: CalendarClock },
  { href: "#projetos", label: "Projetos", icon: FolderKanban, unavailable: true },
  { href: "#configuracoes", label: "Configurações", icon: Settings, unavailable: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-zinc-950 sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-[1600px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/58 shadow-soft backdrop-blur-2xl sm:min-h-[calc(100vh-40px)] lg:flex-row">
        <aside className="flex border-b border-zinc-200/70 bg-white/64 px-3 py-3 lg:w-72 lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="min-w-0 flex-1 lg:flex lg:flex-col">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/15">
                <Clapperboard size={22} />
              </span>
              <span>
                <span className="block text-base font-semibold leading-tight">
                  South Studio
                </span>
                <span className="text-xs font-medium text-zinc-500">
                  Produção audiovisual
                </span>
              </span>
            </Link>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-9 lg:flex-col lg:overflow-visible lg:pb-0">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-disabled={item.unavailable}
                  onClick={item.unavailable ? (event) => event.preventDefault() : undefined}
                  className={`flex min-h-12 min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/10"
                      : "text-zinc-600 hover:bg-white hover:text-zinc-950"
                  } ${item.unavailable ? "cursor-default opacity-45" : ""}`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <InstallApp />
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
