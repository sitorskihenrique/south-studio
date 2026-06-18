"use client";

import { StudioSidebar } from "@/components/StudioSidebar";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready } = useAuthSession();

  return (
    <div className="studio-app min-h-[100dvh] overflow-x-hidden bg-[#f5f6f8] text-zinc-950">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1680px] gap-4 px-3 py-3 sm:px-5 sm:py-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:py-6">
        <StudioSidebar />
        <main className="min-h-0 min-w-0 overflow-hidden rounded-[28px] border border-white/70 bg-white/72 shadow-[0_22px_70px_rgba(16,24,40,0.08)] backdrop-blur-xl">
          {ready ? children : <AppLoading />}
        </main>
      </div>
    </div>
  );
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
