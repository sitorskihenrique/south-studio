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
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div
          className={`hidden gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400 xl:grid ${
            usesComplexity
              ? "grid-cols-[1.25fr_1.3fr_120px_105px_105px_120px_36px]"
              : "grid-cols-[1.25fr_1.5fr_130px_110px_130px_36px]"
          }`}
        >
          <span>Item</span>
          <span>Descrição</span>
          <span>Valor unitário</span>
          {usesComplexity && <span>Complexidade</span>}
          <span>{quantityLabel}</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        <div className="divide-y divide-zinc-100">
          {items.map((item) => (
            <div
              key={item.id}
              className={`grid gap-3 px-4 py-4 xl:items-center ${
                usesComplexity
                  ? "xl:grid-cols-[1.25fr_1.3fr_120px_105px_105px_120px_36px]"
                  : "xl:grid-cols-[1.25fr_1.5fr_130px_110px_130px_36px]"
              }`}
            >
              <TextInput
                aria-label={`${item.item}: item`}
                value={item.item}
                onChange={(event) => updateItem(item.id, { item: event.target.value })}
              />
              <TextInput
                aria-label={`${item.item}: descrição`}
                value={item.description}
                placeholder="Descrição opcional"
                onChange={(event) => updateItem(item.id, { description: event.target.value })}
              />
              <NumberInput
                aria-label={`${item.item}: valor unitário`}
                value={item.unitValue}
                step="10"
                suffix="R$"
                onValueChange={(value) => updateItem(item.id, { unitValue: value })}
              />
              {usesComplexity && (
                <NumberInput
                  aria-label={`${item.item}: complexidade`}
                  value={item.complexity}
                  step="10"
                  suffix="%"
                  onValueChange={(value) => updateItem(item.id, { complexity: value })}
                />
              )}
              <NumberInput
                aria-label={`${item.item}: quantidade`}
                value={item.quantity}
                step="1"
                onValueChange={(value) => updateItem(item.id, { quantity: value })}
              />
              <div className="flex min-h-11 items-center justify-between rounded-xl bg-zinc-50 px-3 xl:justify-end xl:bg-transparent xl:px-0">
                <span className="text-xs font-medium text-zinc-400 xl:hidden">Total</span>
                <span className="text-sm font-semibold tabular-nums text-zinc-800">
                  {formatCurrency(lineTotal(item))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label={`Remover ${item.item}`}
                title="Remover item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange([...items, createEmptyLine()])}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-600 transition hover:border-violet-300 hover:text-violet-700"
      >
        <Plus size={16} />
        Adicionar item
      </button>
    </div>
  );
}

