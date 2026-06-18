"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { setActiveStorageUser } from "@/lib/storage/scope";
import { brand } from "@/lib/brand";
import { LocalizedBrandCopy } from "@/components/LocalizedBrandCopy";

type AuthMode = "login" | "cadastro";

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
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (authError) return setError("E-mail ou senha inválidos.");
      setActiveStorageUser(data.user.id);
      router.push(nextPath);
      router.refresh();
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo, data: { full_name: name.trim() } },
    });
    setLoading(false);
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
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    setLoading(false);
    if (authError) setError("Não foi possível iniciar o login com Google.");
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5f6f8] p-4 text-[#121824] sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1280px] overflow-hidden rounded-[32px] border border-white/80 bg-white/65 shadow-[0_24px_80px_rgba(18,24,36,0.10)] backdrop-blur-xl lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_0.9fr]">
        <section className="flex min-h-[320px] flex-col justify-between bg-[#121824] p-7 text-white sm:p-10 lg:p-14">
          <Link href="/" className="text-xl font-black">{brand.name}</Link>
          <div className="max-w-2xl py-12">
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl"><LocalizedBrandCopy /></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/55"><LocalizedBrandCopy supporting /></p>
          </div>
          <p className="text-xs font-semibold uppercase text-white/35">Audiovisual workspace</p>
        </section>

        <section className="flex flex-col p-6 sm:p-10 lg:p-14">
          <nav className="flex justify-end gap-2">
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${isLogin ? "bg-[#121824] text-white" : "text-zinc-500"}`}>Login</Link>
            <Link href={`/cadastro?next=${encodeURIComponent(nextPath)}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${!isLogin ? "bg-[#121824] text-white" : "text-zinc-500"}`}>Cadastrar</Link>
          </nav>

          <div className="my-auto py-10">
            <p className="text-xs font-bold uppercase text-zinc-400">{isLogin ? "Acesso" : "Nova conta"}</p>
            <h2 className="mt-3 text-3xl font-semibold">{isLogin ? "Entre no seu workspace." : "Crie seu workspace."}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">Projetos, tarefas, orçamentos e filmagens em um fluxo organizado.</p>

            <button type="button" onClick={signInWithGoogle} disabled={loading} className="mt-7 min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60">
              Continuar com Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs font-medium text-zinc-400"><span className="h-px flex-1 bg-zinc-200" />ou use e-mail e senha<span className="h-px flex-1 bg-zinc-200" /></div>

            <form onSubmit={submit} className="space-y-4">
              {!isLogin && <AuthField label="Nome" value={name} onChange={setName} autoComplete="name" placeholder="Seu nome" />}
              <AuthField label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="voce@email.com" />
              <AuthField label="Senha" type="password" value={password} onChange={setPassword} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="Mínimo 6 caracteres" />

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
              {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}

              <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-[#121824] px-5 text-sm font-semibold text-white transition hover:bg-[#1a2333] disabled:opacity-60">
                {loading ? "Processando..." : isLogin ? "Login" : "Cadastrar"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              {isLogin ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
              <Link href={alternateHref} className="font-semibold text-[#121824]">{isLogin ? "Cadastrar" : "Login"}</Link>
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
      <span className="mb-2 block text-sm font-medium text-zinc-700">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none transition focus:border-[#121824] focus:ring-4 focus:ring-[#121824]/5" placeholder={placeholder} autoComplete={autoComplete} />
    </label>
  );
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
