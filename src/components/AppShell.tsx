"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { StudioSidebar } from "@/components/StudioSidebar";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { trackUsageEvent, type UsageTool } from "@/lib/analytics/usage";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, error, retry } = useAuthSession();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || error) return;
    const tool = toolForPath(pathname);
    if (tool) void trackUsageEvent("tool_opened", tool);
  }, [error, pathname, ready]);

  return (
    <div className="studio-app h-[100dvh] overflow-hidden bg-[#eceef2] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-zinc-950 lg:pb-0">
      <div className="mx-auto grid h-full min-h-0 w-full max-w-[1720px] items-stretch gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-5 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:py-6">
        <Suspense fallback={<SidebarLoading />}>
          <StudioSidebar />
        </Suspense>
        <main className="h-full min-h-0 min-w-0 overflow-hidden rounded-[26px] border border-white/70 bg-white/74 shadow-[0_26px_90px_rgba(10,14,24,0.10)] backdrop-blur-2xl sm:rounded-[30px]">
          {!ready ? <AppLoading /> : error ? <AppError message={error} onRetry={retry} /> : children}
        </main>
      </div>
    </div>
  );
}

function toolForPath(pathname: string): UsageTool | null {
  if (pathname === "/dashboard" || pathname === "/app") return "dashboard";
  if (pathname === "/projetos") return "projects";
  if (pathname === "/tarefas") return "tasks";
  if (pathname === "/calculadora") return "budgets";
  if (pathname === "/plano-de-filmagem" || pathname === "/ordem-do-dia") return "film_plans";
  if (pathname === "/configuracoes") return "settings";
  return null;
}

function AppError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-[420px] place-items-center p-6 text-center">
      <div className="max-w-md rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-950">Não foi possível abrir seu workspace.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={onRetry} className="min-h-12 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white">Tentar novamente</button>
          <a href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-700">Voltar ao login</a>
        </div>
      </div>
    </div>
  );
}

function SidebarLoading() {
  return <aside className="hidden h-full min-h-0 animate-pulse rounded-[26px] border border-white/80 bg-white/55 sm:rounded-[30px] lg:block" />;
}

function AppLoading() {
  return (
    <div className="grid h-full min-h-[420px] place-items-center p-6">
      <div className="w-full max-w-3xl space-y-4">
        <div className="h-10 w-52 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-3xl bg-slate-100" />)}
        </div>
      </div>
    </div>
  );
}
