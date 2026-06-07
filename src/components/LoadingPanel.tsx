export function LoadingPanel({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center p-6">
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-500 shadow-sm">
        {label}
      </div>
    </div>
  );
}
