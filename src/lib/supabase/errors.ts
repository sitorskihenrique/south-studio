export function getSupabaseConnectionErrorMessage(error: unknown, fallback: string) {
  const text = getSupabaseErrorText(error).toLowerCase();
  if (isConnectionErrorText(text)) {
    return "Não foi possível conectar ao Supabase. Verifique a internet, as variáveis do ambiente e tente novamente.";
  }
  return fallback;
}

export function getSupabaseErrorText(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const { code, message } = error as { code?: unknown; message?: unknown };
    return `${typeof code === "string" ? code : ""} ${typeof message === "string" ? message : ""}`.trim();
  }
  return typeof error === "string" ? error : "";
}

function isConnectionErrorText(text: string) {
  return text.includes("failed to fetch") ||
    text.includes("fetch failed") ||
    text.includes("networkerror") ||
    text.includes("network error") ||
    text.includes("load failed") ||
    text.includes("cors");
}
