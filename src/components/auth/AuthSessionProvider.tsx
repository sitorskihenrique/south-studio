"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { setActiveStorageUser } from "@/lib/storage/scope";
import { setCloudAuthUser } from "@/lib/supabase/data";

type AuthSessionValue = {
  user: User | null;
  ready: boolean;
};

const AuthSessionContext = createContext<AuthSessionValue>({ user: null, ready: false });

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setActiveStorageUser(null);
      setCloudAuthUser(null);
      setReady(true);
      return;
    }

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setActiveStorageUser(data.user?.id || null);
      setCloudAuthUser(data.user);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setActiveStorageUser(session?.user?.id || null);
      setCloudAuthUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, ready }), [ready, user]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}
