"use client";

import { LockKeyhole, Sparkles, X } from "lucide-react";

export function PremiumPreviewDialog({
  open,
  title,
  description,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] grid place-items-center bg-[#0b0e15]/64 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={title}>
      <section className="relative w-full max-w-md rounded-[26px] border border-white/80 bg-white/95 p-6 text-center shadow-[0_34px_110px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-8">
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-zinc-100 text-zinc-600">
          <X size={18} />
        </button>
        <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#b88a3b]/25 bg-[#f7eedb] px-3 py-1.5 text-[11px] font-bold uppercase text-[#8a6428]">
          <Sparkles size={13} />
          Premium
        </span>
        <span className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#0b0e15] text-white">
          <LockKeyhole size={24} />
        </span>
        <h2 className="mt-6 text-2xl font-semibold text-[#0b0e15]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{description}</p>
        <button type="button" onClick={onClose} className="mt-7 min-h-12 w-full rounded-xl bg-[#0b0e15] px-5 text-sm font-semibold text-white">
          Continuar na versão essencial
        </button>
      </section>
    </div>
  );
}
