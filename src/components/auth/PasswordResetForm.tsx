"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { BrandLogo } from "@/components/ui/BrandLogo";

const AUTH_REQUEST_TIMEOUT_MS = 12_000;

export function PasswordResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setError("Acesso indisponível neste ambiente.");
      setSessionReady(true);
      return;
    }
    const client = supabase;

    let active = true;

    async function loadSession() {
      const result = await withTimeout(client.auth.getSession(), AUTH_REQUEST_TIMEOUT_MS);
      if (!active) return;
      setHasSession(Boolean(result?.data.session));
      setSessionReady(true);
    }

    void loadSession();

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(Boolean(session));
        setSessionReady(true);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured()) return setError("Acesso indisponível neste ambiente.");
    if (password.length < 8) return setError("A nova senha precisa ter pelo menos 8 caracteres.");
    if (password !== confirmPassword) return setError("As senhas não conferem.");

    const supabase = createClient();
    if (!supabase) return setError("Não foi possível redefinir sua senha.");

    setLoading(true);
    const result = await withTimeout(supabase.auth.updateUser({ password }), AUTH_REQUEST_TIMEOUT_MS);
    setLoading(false);

    if (!result) return setError("A conexão demorou mais que o esperado. Tente novamente.");
    if (result.error) return setError(getFriendlyUpdateError(result.error));

    setPassword("");
    setConfirmPassword("");
    setMessage("Senha atualizada com sucesso. Você já pode entrar com a nova senha.");
    setTimeout(() => router.push("/login"), 1800);
  }

  return (
    <main className="studio-auth-backdrop min-h-[100dvh] bg-black p-3 text-white sm:p-5">
      <section className="studio-auth-surface mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[520px] flex-col justify-center rounded-[26px] border border-white/10 bg-black/56 p-5 shadow-[0_32px_110px_rgba(0,0,0,0.55)] sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[32px] sm:p-9">
        <Link href="/" className="mb-10 inline-flex"><BrandLogo className="w-[150px]" priority /></Link>
        <p className="text-xs font-bold uppercase text-white/36">Nova senha</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Defina sua nova senha.</h1>
        <p className="mt-3 text-sm leading-6 text-white/45">Use uma senha com pelo menos 8 caracteres.</p>

        {!sessionReady && <p className="mt-7 rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-medium text-white/70">Validando link de recuperação...</p>}

        {sessionReady && !hasSession && (
          <div className="mt-7 space-y-4">
            <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">Esse link expirou ou não é válido. Solicite um novo link de recuperação.</p>
            <Link href="/recuperar-senha" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[#0b0e15] transition hover:bg-white/88">
              Solicitar novo link
            </Link>
          </div>
        )}

        {sessionReady && hasSession && (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <AuthField label="Nova senha" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
            <AuthField label="Confirmar nova senha" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="Repita a nova senha" />

            {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">{error}</p>}
            {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">{message}</p>}

            <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-white px-5 text-sm font-semibold text-[#0b0e15] transition hover:bg-white/88 disabled:opacity-60">
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}

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

function getFriendlyUpdateError(error: { code?: string; message?: string }) {
  const normalized = `${error.code || ""} ${error.message || ""}`.toLowerCase();
  if (normalized.includes("session")) return "Sua sessão de recuperação expirou. Solicite um novo link.";
  if (normalized.includes("password")) return "A nova senha não atende aos requisitos de segurança.";
  return "Não foi possível atualizar sua senha. Tente novamente.";
}
