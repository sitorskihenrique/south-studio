"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { isTurnstileConfigured, TurnstileChallenge, type TurnstileHandle } from "@/components/auth/TurnstileChallenge";

const AUTH_REQUEST_TIMEOUT_MS = 12_000;
const SUCCESS_MESSAGE = "Se esse e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.";

export function PasswordRecoveryRequestForm() {
  const captchaHandleRef = useRef<TurnstileHandle | null>(null);
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleCaptchaToken = useCallback((token: string) => {
    setCaptchaToken(token);
    setError((current) => (current === "Confirme que voce nao e um robo para continuar." ? "" : current));
  }, []);

  const handleCaptchaError = useCallback((message: string) => {
    setCaptchaToken("");
    setError(message);
  }, []);

  function resetCaptcha() {
    captchaHandleRef.current?.reset();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured()) return setError("Acesso indisponível neste ambiente.");
    if (!validateEmail(email)) return setError("Digite um e-mail válido.");
    if (!isTurnstileConfigured()) return setError("CAPTCHA indisponivel. Configure a chave publica do Turnstile.");
    if (!captchaToken) return setError("Confirme que voce nao e um robo para continuar.");

    const supabase = createClient();
    if (!supabase) return setError("Não foi possível iniciar a recuperação.");

    setLoading(true);
    const result = await withTimeout(
      supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/redefinir-senha")}`,
        captchaToken,
      }),
      AUTH_REQUEST_TIMEOUT_MS,
    );
    setLoading(false);
    resetCaptcha();

    if (!result) return setError("A conexão demorou mais que o esperado. Tente novamente.");
    if (result.error) return setError(getFriendlyResetRequestError(result.error));

    setMessage(SUCCESS_MESSAGE);
  }

  return (
    <main className="studio-auth-backdrop min-h-[100dvh] bg-black p-3 text-white sm:p-5">
      <section className="studio-auth-surface mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[520px] flex-col justify-center rounded-[26px] border border-white/10 bg-black/56 p-5 shadow-[0_32px_110px_rgba(0,0,0,0.55)] sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[32px] sm:p-9">
        <Link href="/" className="mb-10 inline-flex"><BrandLogo className="w-[150px]" priority /></Link>
        <p className="text-xs font-bold uppercase text-white/36">Recuperação</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Redefina sua senha.</h1>
        <p className="mt-3 text-sm leading-6 text-white/45">Informe o e-mail da conta para receber o link de redefinição.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <AuthField label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="voce@email.com" />
          <TurnstileChallenge action="password_reset" onToken={handleCaptchaToken} onError={handleCaptchaError} handleRef={captchaHandleRef} />

          {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">{error}</p>}
          {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">{message}</p>}

          <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-white px-5 text-sm font-semibold text-[#0b0e15] transition hover:bg-white/88 disabled:opacity-60">
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <Link href="/login" className="mt-6 text-center text-sm font-semibold text-white/70 transition hover:text-white">
          Voltar para login
        </Link>
      </section>
    </main>
  );
}

function AuthField({ label, type = "text", value, onChange, autoComplete, placeholder }: { label: string; type?: string; value: string; onChange: (value: string) => void; autoComplete: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/58">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-xl border border-white/12 bg-white/[0.055] px-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-white/30 focus:bg-white/[0.08] focus:ring-4 focus:ring-white/5" placeholder={placeholder} autoComplete={autoComplete} />
    </label>
  );
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function getFriendlyResetRequestError(error: { code?: string; message?: string }) {
  const normalized = `${error.code || ""} ${error.message || ""}`.toLowerCase();
  if (normalized.includes("captcha")) return "Não foi possível validar a proteção contra abuso. Tente novamente.";
  if (normalized.includes("rate") || normalized.includes("too many")) return "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.";
  return SUCCESS_MESSAGE;
}
