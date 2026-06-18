"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { setActiveStorageUser } from "@/lib/storage/scope";
import { flushPendingCloudOperations, setCloudAuthUser } from "@/lib/supabase/data";

type AuthSessionValue = {
  user: User | null;
  ready: boolean;
  error: string;
  retry: () => void;
};

const AuthSessionContext = createContext<AuthSessionValue>({
  user: null,
  ready: false,
  error: "",
  retry: () => undefined,
});

const SESSION_TIMEOUT_MS = 8_000;

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setReady(false);
    setError("");
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setActiveStorageUser(null);
      setCloudAuthUser(null);
      setError("A conexão com a conta não está configurada neste ambiente.");
      setReady(true);
      return;
    }
    const client = supabase;

    let active = true;

    async function loadSession() {
      try {
        const result = await withTimeout(client.auth.getUser(), SESSION_TIMEOUT_MS);
        if (!active) return;
        if (!result) {
          setError("A conexão com sua conta demorou mais que o esperado.");
          setReady(true);
          return;
        }
        if (result.error && !result.data.user) {
          setUser(null);
          setActiveStorageUser(null);
          setCloudAuthUser(null);
          setError("Não foi possível validar sua sessão. Entre novamente.");
          setReady(true);
          return;
        }

        const nextUser = result.data.user;
        setUser(nextUser);
        setActiveStorageUser(nextUser?.id || null);
        setCloudAuthUser(nextUser);
        if (!active) return;
        setError("");
        setReady(true);
        if (nextUser) void flushPendingCloudOperations();
      } catch {
        if (!active) return;
        setError("Não foi possível conectar à sua conta. Verifique a internet e tente novamente.");
        setReady(true);
      }
    }

    void loadSession();

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setActiveStorageUser(nextUser?.id || null);
      setCloudAuthUser(nextUser);
      setError("");
      setReady(true);
      if (nextUser) void flushPendingCloudOperations();
    });

    const retryPending = () => void flushPendingCloudOperations();
    window.addEventListener("online", retryPending);
    window.addEventListener("focus", retryPending);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("online", retryPending);
      window.removeEventListener("focus", retryPending);
    };
  }, [attempt]);

  const value = useMemo(() => ({ user, ready, error, retry }), [error, ready, retry, user]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
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
