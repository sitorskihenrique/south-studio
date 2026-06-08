"use client";

import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function LoggedUserCard({
  user,
  signingOut,
  onSignOut,
}: {
  user: User | null;
  signingOut: boolean;
  onSignOut: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Conta</p>
      <p className="mt-2 truncate text-sm font-semibold text-zinc-100">
        {user?.user_metadata?.full_name || user?.email || "Usuário"}
      </p>
      {user?.email && <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>}
      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-white px-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60"
      >
        <LogOut size={16} />
        {signingOut ? "Saindo..." : "Sair"}
      </button>
    </div>
  );
}
