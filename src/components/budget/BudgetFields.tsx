"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

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
    <section className="studio-card rounded-[28px] p-4 sm:p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">
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
      className={`h-11 w-full rounded-2xl border border-zinc-200 bg-white/92 px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-950/5 ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-11 w-full rounded-2xl border border-zinc-200 bg-white/92 px-3.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-950/5 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-28 w-full resize-y rounded-2xl border border-zinc-200 bg-white/92 px-3.5 py-3 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-950/5 ${props.className ?? ""}`}
    />
  );
}

export function NumberInput({
  value,
  onValueChange,
  suffix,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
  suffix?: string;
}) {
  const [inputValue, setInputValue] = useState(() => formatInputNumber(value));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setInputValue(formatInputNumber(value));
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = sanitizeNumberInput(event.target.value);
    setInputValue(next);
    onValueChange(parseInputNumber(next));
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    isFocused.current = true;
    if (parseInputNumber(inputValue) === 0) setInputValue("");
    props.onFocus?.(event);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    isFocused.current = false;
    setInputValue(formatInputNumber(parseInputNumber(inputValue)));
    props.onBlur?.(event);
  }

  return (
    <div className="relative">
      <input
        {...props}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`h-11 w-full rounded-2xl border border-zinc-200 bg-white/92 px-3.5 text-sm tabular-nums text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-950/5 ${
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

function sanitizeNumberInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [integer = "", ...decimalParts] = normalized.split(".");
  const decimal = decimalParts.join("");
  const cleanInteger = integer.replace(/^0+(?=\d)/, "") || (decimal ? "0" : integer);

  if (!normalized.includes(".")) return cleanInteger;
  return `${cleanInteger || "0"}.${decimal}`;
}

function parseInputNumber(value: string) {
  if (!value.trim()) return 0;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatInputNumber(value: number) {
  if (!Number.isFinite(value) || value === 0) return "0";
  return String(value).replace(".", ",");
}
