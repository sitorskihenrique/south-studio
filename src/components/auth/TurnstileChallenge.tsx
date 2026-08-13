"use client";

import Script from "next/script";
import { type MutableRefObject, useEffect, useRef, useState } from "react";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileWidgetId = string;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "dark" | "light" | "auto";
          action?: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => TurnstileWidgetId;
      reset: (widgetId?: TurnstileWidgetId) => void;
      remove: (widgetId: TurnstileWidgetId) => void;
    };
  }
}

export type TurnstileHandle = {
  reset: () => void;
};

export function isTurnstileConfigured() {
  return Boolean(TURNSTILE_SITE_KEY);
}

export function TurnstileChallenge({
  action,
  onToken,
  onError,
  handleRef,
}: {
  action?: string;
  onToken: (token: string) => void;
  onError: (message: string) => void;
  handleRef?: MutableRefObject<TurnstileHandle | null>;
}) {
  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const captchaWidgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);

  useEffect(() => {
    if (handleRef) {
      handleRef.current = {
        reset() {
          onToken("");
          if (captchaWidgetIdRef.current && window.turnstile) window.turnstile.reset(captchaWidgetIdRef.current);
        },
      };
    }

    return () => {
      if (handleRef) handleRef.current = null;
    };
  }, [handleRef, onToken]);

  useEffect(() => {
    if (!captchaReady || !TURNSTILE_SITE_KEY || !captchaContainerRef.current || captchaWidgetIdRef.current || !window.turnstile) return;

    captchaWidgetIdRef.current = window.turnstile.render(captchaContainerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "dark",
      action,
      callback: onToken,
      "expired-callback": () => {
        onToken("");
        onError("O CAPTCHA expirou. Confirme novamente para continuar.");
      },
      "error-callback": () => {
        onToken("");
        onError("Nao foi possivel validar o CAPTCHA. Tente novamente.");
      },
    });

    return () => {
      if (captchaWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(captchaWidgetIdRef.current);
        captchaWidgetIdRef.current = null;
      }
    };
  }, [action, captchaReady, onError, onToken]);

  return (
    <>
      {TURNSTILE_SITE_KEY && <Script src={TURNSTILE_SCRIPT_SRC} strategy="afterInteractive" onLoad={() => setCaptchaReady(true)} onError={() => onError("Nao foi possivel carregar o CAPTCHA. Tente novamente.")} />}
      <div className="min-h-[65px] overflow-hidden rounded-xl border border-white/10 bg-black/20 px-3 py-2">
        {TURNSTILE_SITE_KEY ? (
          <div ref={captchaContainerRef} className="flex min-h-[45px] items-center justify-center" />
        ) : (
          <p className="flex min-h-[45px] items-center justify-center text-center text-sm font-medium text-amber-100/85">Configure a chave publica do Turnstile para liberar o acesso por e-mail.</p>
        )}
      </div>
    </>
  );
}
