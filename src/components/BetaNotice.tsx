"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const storageKey = "south-studio-beta-notice-dismissed-v1";

export function BetaNotice() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(window.localStorage.getItem(storageKey) !== "true"); }, []);
  if (!visible) return null;

  function dismiss() {
    window.localStorage.setItem(storageKey, "true");
    setVisible(false);
  }

  return (
    <aside className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-3 right-3 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-500 lg:bottom-7 lg:left-auto lg:right-7 lg:max-w-sm" aria-label="Aviso de versão beta">
      <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-[0_16px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-950 text-white"><Sparkles size={15} /></span>
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Early access</p><p className="mt-1 text-xs leading-5 text-zinc-600">Estamos refinando o workflow audiovisual. Seu feedback ajuda a moldar o South Studio.</p></div>
        <button type="button" onClick={dismiss} aria-label="Fechar aviso beta" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950"><X size={15} /></button>
      </div>
    </aside>
  );
}
