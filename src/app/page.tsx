import Link from "next/link";
import { LocalizedBrandCopy } from "@/components/LocalizedBrandCopy";
import { brand } from "@/lib/brand";

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-[#f5f6f8] p-4 text-[#121824] sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1480px] gap-4 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-5">
        <aside className="flex flex-col justify-between rounded-[30px] border border-white/80 bg-white/58 p-6 shadow-[0_22px_70px_rgba(18,24,36,0.08)] backdrop-blur-2xl">
          <p className="text-xl font-black">{brand.name}</p>
          <p className="mt-12 text-sm leading-6 text-zinc-500 lg:mt-0">A professional workspace for audiovisual production.</p>
        </aside>

        <section className="flex min-h-[620px] flex-col justify-between rounded-[30px] border border-white/10 bg-[#121824] p-7 text-white shadow-[0_28px_80px_rgba(18,24,36,0.24)] sm:p-10 lg:p-14">
          <header className="flex items-center justify-end gap-2">
            <Link href="/login" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/8 hover:text-white">Login</Link>
            <Link href="/cadastro" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#121824] transition hover:bg-white/90">Cadastrar</Link>
          </header>

          <div className="max-w-5xl py-16">
            <p className="text-xs font-bold uppercase text-white/35">Audiovisual production workspace</p>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.98] sm:text-7xl lg:text-8xl"><LocalizedBrandCopy /></h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/55 sm:text-lg"><LocalizedBrandCopy supporting /></p>
          </div>

          <p className="text-sm text-white/35">Projects. Production. Finance. One connected system.</p>
        </section>
      </div>
    </main>
  );
}
