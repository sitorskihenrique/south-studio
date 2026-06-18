"use client";

import { useEffect, useState } from "react";
import { brandCopy, resolveLocale } from "@/lib/i18n/copy";

export function LocalizedBrandCopy({ supporting = false, className = "" }: { supporting?: boolean; className?: string }) {
  const [locale, setLocale] = useState(() => resolveLocale("pt-BR"));

  useEffect(() => {
    setLocale(resolveLocale(navigator.language));
  }, []);

  const copy = brandCopy(locale);
  return <span className={className}>{supporting ? copy.supporting : copy.headline}</span>;
}
