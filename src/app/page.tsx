import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createServerSupabase();
  if (supabase) {
    const result = await withTimeout(supabase.auth.getUser(), 6_000);
    if (result?.data.user) redirect("/dashboard");
  }

  return <AuthForm mode="login" />;
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
