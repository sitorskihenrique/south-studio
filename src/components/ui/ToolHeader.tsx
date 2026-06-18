import type { ReactNode } from "react";

export function ToolHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="studio-tool-header">
      <div className="studio-tool-header__texture" aria-hidden="true" />
      <div className="relative z-10">
        <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <p className="studio-eyebrow text-white/62">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.02] text-white sm:text-6xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </header>
  );
}
