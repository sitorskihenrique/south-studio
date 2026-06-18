import Link from "next/link";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";

export function FeaturePreviewLock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100dvh-3rem)] overflow-hidden">
      <div
        inert
        aria-hidden="true"
        className="pointer-events-none max-h-[calc(100dvh-3rem)] select-none overflow-hidden opacity-50 blur-[3px] saturate-50"
      >
        {children}
      </div>

      <div className="absolute inset-0 z-20 grid place-items-center bg-[#0b0e15]/24 p-4 backdrop-blur-[2px] sm:p-8">
        <section className="w-full max-w-lg rounded-[28px] border border-white/75 bg-white/90 p-6 text-center shadow-[0_28px_90px_rgba(10,14,24,0.25)] backdrop-blur-2xl sm:p-9">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#b88a3b]/25 bg-[#f7eedb]/80 px-3 py-1.5 text-[11px] font-bold uppercase text-[#8a6428]">
            <Sparkles size={13} />
            Em desenvolvimento
          </span>

          <span className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#0b0e15] text-white shadow-lg shadow-zinc-950/15">
            <LockKeyhole size={24} strokeWidth={1.8} />
          </span>

          <h1 className="mt-6 text-2xl font-semibold tracking-normal text-[#0b0e15] sm:text-3xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">{description}</p>
          <p className="mt-4 text-xs font-semibold text-zinc-400">Estamos refinando esta experiência para o próximo acesso.</p>

          <Link
            href="/dashboard"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b0e15] px-5 text-sm font-semibold text-white transition hover:bg-[#171b25] sm:w-auto"
          >
            <ArrowLeft size={17} />
            Voltar ao Dashboard
          </Link>
        </section>
      </div>
    </div>
  );
}
