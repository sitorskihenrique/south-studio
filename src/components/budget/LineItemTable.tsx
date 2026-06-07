"use client";

import { Plus, Trash2 } from "lucide-react";
import { formatCurrency, lineTotal } from "@/lib/budget/calculations";
import { createEmptyLine } from "@/lib/budget/defaults";
import { BudgetLine } from "@/lib/budget/types";
import { NumberInput, TextInput } from "./BudgetFields";

export function LineItemTable({
  items,
  usesComplexity,
  quantityLabel,
  onChange,
}: {
  items: BudgetLine[];
  usesComplexity: boolean;
  quantityLabel: string;
  onChange: (items: BudgetLine[]) => void;
}) {
  function updateItem(id: string, patch: Partial<BudgetLine>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 xl:overflow-hidden xl:bg-white xl:p-0">
        <div className={`hidden gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400 xl:grid ${usesComplexity ? "grid-cols-[1.25fr_1.3fr_120px_105px_105px_120px_36px]" : "grid-cols-[1.25fr_1.5fr_130px_110px_130px_36px]"}`}>
          <span>Item</span><span>Descrição</span><span>Valor unitário</span>
          {usesComplexity && <span>Complexidade</span>}
          <span>{quantityLabel}</span><span className="text-right">Total</span><span />
        </div>

        <div className="space-y-3 xl:space-y-0 xl:divide-y xl:divide-zinc-100">
          {items.map((item) => (
            <div key={item.id} className={`grid gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-4 shadow-sm xl:items-center xl:rounded-none xl:border-0 xl:px-4 xl:shadow-none ${usesComplexity ? "xl:grid-cols-[1.25fr_1.3fr_120px_105px_105px_120px_36px]" : "xl:grid-cols-[1.25fr_1.5fr_130px_110px_130px_36px]"}`}>
              <MobileField label="Item"><TextInput aria-label={`${item.item}: item`} value={item.item} onChange={(event) => updateItem(item.id, { item: event.target.value })} /></MobileField>
              <MobileField label="Descrição"><TextInput aria-label={`${item.item}: descrição`} value={item.description} placeholder="Descrição opcional" onChange={(event) => updateItem(item.id, { description: event.target.value })} /></MobileField>
              <MobileField label="Valor unitário"><NumberInput aria-label={`${item.item}: valor unitário`} value={item.unitValue} step="10" suffix="R$" onValueChange={(value) => updateItem(item.id, { unitValue: value })} /></MobileField>
              {usesComplexity && <MobileField label="Complexidade"><NumberInput aria-label={`${item.item}: complexidade`} value={item.complexity} step="10" suffix="%" onValueChange={(value) => updateItem(item.id, { complexity: value })} /></MobileField>}
              <MobileField label={quantityLabel}><NumberInput aria-label={`${item.item}: quantidade`} value={item.quantity} step="1" onValueChange={(value) => updateItem(item.id, { quantity: value })} /></MobileField>
              <div className="flex min-h-12 items-center justify-between rounded-xl bg-zinc-50 px-3 xl:justify-end xl:bg-transparent xl:px-0">
                <span className="text-xs font-medium text-zinc-400 xl:hidden">Total</span>
                <span className="text-sm font-semibold tabular-nums text-zinc-800">{formatCurrency(lineTotal(item))}</span>
              </div>
              <button type="button" onClick={() => removeItem(item.id)} className="ml-auto grid h-11 w-11 place-items-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600" aria-label={`Remover ${item.item}`} title="Remover item">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => onChange([...items, createEmptyLine()])} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-600 transition hover:border-violet-300 hover:text-violet-700">
        <Plus size={16} />Adicionar item
      </button>
    </div>
  );
}

function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="min-w-0"><span className="mb-1.5 block text-xs font-semibold text-zinc-500 xl:hidden">{label}</span>{children}</label>;
}
