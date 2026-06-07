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
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Conta</p>
      <p className="mt-2 truncate text-sm font-semibold text-zinc-800">
        {user?.user_metadata?.full_name || user?.email || "Usuário"}
      </p>
      {user?.email && <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>}
      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        <LogOut size={16} />
        {signingOut ? "Saindo..." : "Sair"}
      </button>
    </div>
  );
}
