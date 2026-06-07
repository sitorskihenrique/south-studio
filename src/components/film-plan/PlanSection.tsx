"use client";

import type { ReactNode } from "react";

export function PlanSection({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200/80 bg-white/86 p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">{title}</h2>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

