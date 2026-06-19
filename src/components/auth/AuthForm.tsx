"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { setActiveStorageUser } from "@/lib/storage/scope";
import { LocalizedBrandCopy } from "@/components/LocalizedBrandCopy";
import { BrandLogo } from "@/components/ui/BrandLogo";

type AuthMode = "login" | "cadastro";
const AUTH_REQUEST_TIMEOUT_MS = 12_000;

export function AuthForm({ mode, nextPath = "/dashboard", missingConfig }: { mode: AuthMode; nextPath?: string; missingConfig?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(missingConfig ? "Ambiente de acesso indisponível. Verifique a configuração do aplicativo." : "");

  const isLogin = mode === "login";
  const alternateHref = `${isLogin ? "/cadastro" : "/login"}?next=${encodeURIComponent(nextPath)}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured()) return setError("Acesso indisponível neste ambiente.");
    if (!validateEmail(email)) return setError("Digite um e-mail válido.");
    if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (!isLogin && name.trim().length < 2) return setError("Digite seu nome para criar a conta.");

    const supabase = createClient();
    if (!supabase) return setError("Não foi possível iniciar o acesso.");

    setLoading(true);
    if (isLogin) {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        AUTH_REQUEST_TIMEOUT_MS,
      );
      setLoading(false);
      if (!result) return setError("A conexão demorou mais que o esperado. Tente novamente.");
      const { data, error: authError } = result;
      if (authError) return setError("E-mail ou senha inválidos.");
      setActiveStorageUser(data.user.id);
      router.push(nextPath);
      router.refresh();
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const result = await withTimeout(
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo, data: { full_name: name.trim() } },
      }),
      AUTH_REQUEST_TIMEOUT_MS,
    );
    setLoading(false);
    if (!result) return setError("A conexão demorou mais que o esperado. Tente novamente.");
    const { data, error: authError } = result;
    if (authError) return setError(authError.message);
    if (data.session) {
      setActiveStorageUser(data.user?.id || null);
      router.push(nextPath);
      router.refresh();
      return;
    }
    setMessage("Conta criada. Confira seu e-mail para confirmar o acesso.");
  }

  async function signInWithGoogle() {
    setError("");
    setMessage("");
    if (!isSupabaseConfigured()) return setError("Acesso indisponível neste ambiente.");

    const supabase = createClient();
    if (!supabase) return setError("Não foi possível iniciar o acesso.");

    setLoading(true);
    const result = await withTimeout(
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
      }),
      AUTH_REQUEST_TIMEOUT_MS,
    );
    setLoading(false);
    if (!result) return setError("A conexão demorou mais que o esperado. Tente novamente.");
    const { error: authError } = result;
    if (authError) setError("Não foi possível iniciar o login com Google.");
  }

  return (
    <main className="studio-auth-backdrop min-h-[100dvh] bg-black p-3 text-white sm:p-5">
      <div className="studio-auth-surface mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1480px] overflow-hidden rounded-[26px] border border-white/10 shadow-[0_32px_110px_rgba(0,0,0,0.55)] sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[32px] lg:grid-cols-[1fr_480px]">
        <span className="studio-liquid-detail" aria-hidden="true" />
        <section className="hidden flex-col justify-between p-10 lg:flex lg:p-14">
          <Link href="/"><BrandLogo className="w-[190px]" priority /></Link>
          <div className="max-w-3xl py-14">
            <h1 className="text-6xl font-medium leading-[0.98] xl:text-7xl"><LocalizedBrandCopy /></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/50"><LocalizedBrandCopy supporting /></p>
          </div>
          <span className="h-px w-16 bg-white/22" />
        </section>

        <section className="m-2 flex flex-col rounded-[22px] border border-white/12 bg-black/56 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:m-4 sm:p-8 lg:m-5 lg:p-9">
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <Link href="/" className="lg:hidden"><BrandLogo className="w-[132px]" priority /></Link>
            <nav className="flex gap-1 rounded-full border border-white/16 bg-black/35 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className={`inline-flex min-h-11 min-w-[86px] items-center justify-center rounded-full px-4 py-2.5 text-center text-sm font-semibold ${isLogin ? "bg-white text-[#0b0e15] shadow-lg shadow-white/10" : "text-white/62 hover:bg-white/[0.08] hover:text-white"}`}>Login</Link>
              <Link href={`/cadastro?next=${encodeURIComponent(nextPath)}`} className={`inline-flex min-h-11 min-w-[104px] items-center justify-center rounded-full px-4 py-2.5 text-center text-sm font-semibold ${!isLogin ? "bg-white text-[#0b0e15] shadow-lg shadow-white/10" : "text-white/62 hover:bg-white/[0.08] hover:text-white"}`}>Cadastrar</Link>
            </nav>
          </div>

          <div className="my-auto py-10">
            <p className="text-xs font-bold uppercase text-white/36">{isLogin ? "Acesso" : "Nova conta"}</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{isLogin ? "Entre no seu workspace." : "Crie seu workspace."}</h2>
            <p className="mt-3 text-sm leading-6 text-white/45">{isLogin ? "Acesse sua conta para continuar." : "Configure seu acesso em poucos passos."}</p>

            <button type="button" onClick={signInWithGoogle} disabled={loading} className="mt-7 min-h-12 w-full rounded-xl border border-white/14 bg-white/[0.07] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:opacity-60">
              Continuar com Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs font-medium text-white/30"><span className="h-px flex-1 bg-white/10" />ou use e-mail e senha<span className="h-px flex-1 bg-white/10" /></div>

            <form onSubmit={submit} className="space-y-4">
              {!isLogin && <AuthField label="Nome" value={name} onChange={setName} autoComplete="name" placeholder="Seu nome" />}
              <AuthField label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="voce@email.com" />
              <AuthField label="Senha" type="password" value={password} onChange={setPassword} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="Mínimo 6 caracteres" />

              {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">{error}</p>}
              {message && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200">{message}</p>}

              <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-white px-5 text-sm font-semibold text-[#0b0e15] transition hover:bg-white/88 disabled:opacity-60">
                {loading ? "Processando..." : isLogin ? "Login" : "Cadastrar"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/42">
              {isLogin ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
              <Link href={alternateHref} className="font-semibold text-white">{isLogin ? "Cadastrar" : "Login"}</Link>
            </p>
          </div>
        </section>
      </div>
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
