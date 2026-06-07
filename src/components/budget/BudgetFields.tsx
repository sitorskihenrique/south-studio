"use client";

import { ReactNode } from "react";

export function BudgetSection({
  eyebrow,
  title,
  description,
  total,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  total?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/82 p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">{title}</h2>
          {description && <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>}
        </div>
        {total && (
          <div className="shrink-0">
            <p className="text-xs font-medium text-zinc-500">Subtotal</p>
            <p className="mt-1 text-lg font-semibold text-zinc-950">{total}</p>
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-zinc-400">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-28 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 ${props.className ?? ""}`}
    />
  );
}

export function NumberInput({
  value,
  onValueChange,
  suffix,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number;
  onValueChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        {...props}
        type="number"
        min="0"
        value={value}
        onChange={(event) => onValueChange(Math.max(0, Number(event.target.value) || 0))}
        className={`h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm tabular-nums text-zinc-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 ${
          suffix ? "pr-12" : ""
        } ${props.className ?? ""}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-zinc-400">
          {suffix}
        </span>
      )}
    </div>
  );
}
