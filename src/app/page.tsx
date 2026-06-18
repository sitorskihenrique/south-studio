import Link from "next/link";
import { LocalizedBrandCopy } from "@/components/LocalizedBrandCopy";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function LandingPage() {
  return (
    <main className="studio-auth-backdrop min-h-[100dvh] bg-black p-3 text-white sm:p-5">
      <section className="studio-auth-surface mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[1720px] flex-col overflow-hidden rounded-[26px] border border-white/10 px-5 py-5 shadow-[0_32px_110px_rgba(0,0,0,0.5)] sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[32px] sm:px-9 sm:py-8 lg:px-14 lg:py-10">
        <span className="studio-liquid-detail" aria-hidden="true" />
        <header className="flex items-center justify-between gap-5">
          <BrandLogo className="w-[150px] sm:w-[190px]" priority />
          <nav className="flex items-center gap-2 rounded-full border border-white/12 bg-black/24 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <Link href="/login" className="studio-dark-action min-w-[96px] px-5">Login</Link>
            <Link href="/cadastro" className="studio-dark-action studio-dark-action--primary min-w-[112px] px-5">Cadastrar</Link>
          </nav>
        </header>

        <div className="my-auto max-w-5xl py-20 sm:py-28">
          <h1 className="max-w-4xl text-[clamp(3rem,8vw,7.4rem)] font-medium leading-[0.94] text-white">
            <LocalizedBrandCopy />
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/54 sm:text-lg">
            <LocalizedBrandCopy supporting />
          </p>
        </div>

      </section>
    </main>
  );
}
