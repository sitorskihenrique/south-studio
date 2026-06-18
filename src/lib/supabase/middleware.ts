import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";
import { sanitizeInternalPath } from "@/lib/auth/redirect";

const AUTH_TIMEOUT_MS = 7000;

const protectedRoutes = [
  "/dashboard",
  "/calculadora",
  "/plano-de-filmagem",
  "/tarefas",
  "/projetos",
  "/configuracoes",
  "/app",
  "/ordem-do-dia",
];

const authRoutes = ["/login", "/cadastro"];

function matches(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function redirectWithCookies(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const isProtected = matches(pathname, protectedRoutes);
  const isAuth = matches(pathname, authRoutes);

  if (!isSupabaseConfigured() || !supabaseUrl || !supabaseAnonKey) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      redirectUrl.searchParams.set("config", "missing");
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const userResult = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);
  const user = userResult?.data?.user ?? null;

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return redirectWithCookies(redirectUrl, response);
  }

  if (isAuth && user) {
    const redirectUrl = request.nextUrl.clone();
    const next = sanitizeInternalPath(request.nextUrl.searchParams.get("next"));
    redirectUrl.pathname = next.split("?")[0];
    const query = next.includes("?") ? next.slice(next.indexOf("?")) : "";
    redirectUrl.search = "";
    if (query) redirectUrl.search = query;
    return redirectWithCookies(redirectUrl, response);
  }

  return response;
}
