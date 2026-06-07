"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AuthMode = "login" | "cadastro";

export function AuthForm({ mode, nextPath = "/dashboard", missingConfig }: { mode: AuthMode; nextPath?: string; missingConfig?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(missingConfig ? "Configure as variáveis do Supabase para acessar a área interna." : "");

  const title = mode === "login" ? "Entrar no South Studio" : "Criar sua conta";
  const action = mode === "login" ? "Entrar" : "Criar conta";
  const alternateHref = `${mode === "login" ? "/cadastro" : "/login"}?next=${encodeURIComponent(nextPath)}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured()) return setError("Supabase ainda não está configurado neste ambiente.");
    if (!validateEmail(email)) return setError("Digite um e-mail válido.");
    if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
    if (mode === "cadastro" && name.trim().length < 2) return setError("Digite seu nome para criar a conta.");

    const supabase = createClient();
    if (!supabase) return setError("Não foi possível iniciar o Supabase.");

    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (error) return setError("E-mail ou senha inválidos.");
      router.push(nextPath);
      router.refresh();
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo, data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data.session) {
      router.push(nextPath);
      router.refresh();
      return;
    }
    setMessage("Conta criada. Confira seu e-mail se o Supabase pedir confirmação.");
  }

  async function signInWithGoogle() {
    setError("");
    setMessage("");
    if (!isSupabaseConfigured()) return setError("Supabase ainda não está configurado neste ambiente.");

    const supabase = createClient();
    if (!supabase) return setError("Não foi possível iniciar o Supabase.");

    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    setLoading(false);
    if (error) setError("Não foi possível iniciar o login com Google.");
  }

  return (
    <main className="min-h-[100dvh] bg-zinc-100 px-4 py-6 text-zinc-950 sm:grid sm:place-items-center">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-soft lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden bg-zinc-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-zinc-950">S</span>South Studio</Link>
          <div>
            <p className="text-sm font-medium text-teal-200">Produção audiovisual segura</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Ferramentas protegidas para equipes reais.</h1>
            <p className="mt-5 text-sm leading-6 text-zinc-300">Login, banco de dados por usuário e base pronta para distribuir o South Studio sem misturar informações entre contas.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-4 text-sm text-zinc-200"><ShieldCheck size={19} className="text-teal-200" />Dados separados por usuário com RLS.</div>
        </div>

        <div className="p-5 sm:p-8">
          <Link href="/" className="mb-8 inline-flex items-center text-sm font-semibold text-zinc-500 lg:hidden">South Studio</Link>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">{mode === "login" ? "Acesso" : "Cadastro"}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">Acesse dashboard, calculadora, plano de filmagem e tarefas com seus dados salvos na sua conta.</p>

          <button type="button" onClick={signInWithGoogle} disabled={loading} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60">
            <Mail size={18} />Continuar com Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs font-medium text-zinc-400"><span className="h-px flex-1 bg-zinc-200" />ou use e-mail e senha<span className="h-px flex-1 bg-zinc-200" /></div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "cadastro" && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-700">Nome</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" placeholder="Seu nome" />
              </label>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700">E-mail</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" placeholder="voce@email.com" autoComplete="email" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700">Senha</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" placeholder="Mínimo 6 caracteres" autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </label>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
            {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}

            <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-lg shadow-zinc-950/15 disabled:opacity-60">
              {loading ? "Processando..." : action}<ArrowRight size={17} />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <Link href={alternateHref} className="font-semibold text-zinc-950">{mode === "login" ? "Criar conta" : "Entrar"}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
