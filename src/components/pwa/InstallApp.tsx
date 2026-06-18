"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    setInstalled(isStandalone());
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
      setInstalled(false);
    };
    const onInstalled = () => {
      setPrompt(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") setPrompt(null);
  }

  if (installed) return null;

  if (isIOS) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-3 text-zinc-600 shadow-sm lg:mt-auto">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-950 text-white">
          <Share size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Instalar Cologne OS</p>
          <p className="mt-1 text-xs leading-5">Toque em Compartilhar &gt; Adicionar à Tela de Início</p>
        </div>
      </div>
    );
  }

  if (!prompt) return null;

  return (
    <button
      type="button"
      onClick={install}
      className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 text-sm font-semibold text-white shadow-lg shadow-zinc-950/15 transition hover:bg-zinc-800 lg:mt-auto"
    >
      <Download size={18} />
      Instalar Cologne OS
    </button>
  );
}
