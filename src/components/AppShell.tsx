"use client";

import { StudioSidebar } from "@/components/StudioSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-app min-h-[100dvh] overflow-x-hidden bg-[#f5f6f8] text-zinc-950">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1680px] gap-4 px-3 py-3 sm:px-5 sm:py-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5 lg:px-6 lg:py-6">
        <StudioSidebar />
        <main className="min-h-0 min-w-0 overflow-hidden rounded-[28px] border border-white/70 bg-white/72 shadow-[0_22px_70px_rgba(16,24,40,0.08)] backdrop-blur-xl">
          {children}
        </main>
      </div>
    </div>
  );
}
