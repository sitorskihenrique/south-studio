export type SupportedLocale = "pt-BR" | "en";

export function resolveLocale(language?: string): SupportedLocale {
  return language?.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
}

export function brandCopy(locale: SupportedLocale) {
  return locale === "pt-BR"
    ? {
        headline: "Feito para Produção Audiovisual.",
        supporting: "Organize projetos, tarefas, orçamentos e filmagens em um único fluxo.",
      }
    : {
        headline: "Built for Audiovisual Production.",
        supporting: "Organize projects, tasks, budgets, and productions in one connected workflow.",
      };
}
