"use client";

import { Suspense } from "react";
import { StudioSidebar } from "@/components/StudioSidebar";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready } = useAuthSession();

  return (
    <div className="studio-app min-h-[100dvh] overflow-x-hidden bg-[#eceef2] text-zinc-950">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1720px] gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-5 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:py-6">
        <Suspense fallback={<SidebarLoading />}>
          <StudioSidebar />
        </Suspense>
        <main className="min-h-0 min-w-0 overflow-hidden rounded-[26px] border border-white/70 bg-white/74 shadow-[0_26px_90px_rgba(10,14,24,0.10)] backdrop-blur-2xl sm:rounded-[30px]">
          {ready ? children : <AppLoading />}
        </main>
      </div>
    </div>
  );
}

function SidebarLoading() {
  return <aside className="min-h-20 animate-pulse rounded-[26px] border border-white/80 bg-white/55 sm:rounded-[30px] lg:min-h-[calc(100dvh-3rem)]" />;
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
