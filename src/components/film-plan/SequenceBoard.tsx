"use client";

import { Plus, Trash2 } from "lucide-react";
import { TextArea, TextInput } from "@/components/budget/BudgetFields";
import { createTake } from "@/lib/film-plan/defaults";
import type { Sequence, Take } from "@/lib/film-plan/types";
import { TakeCard } from "./TakeCard";
import { useRef } from "react";

export function SequenceBoard({
  sequence,
  onChange,
  onRemove,
}: {
  sequence: Sequence;
  onChange: (sequence: Sequence) => void;
  onRemove: () => void;
}) {
  const dragIndex = useRef<number | null>(null);

  function updateTake(take: Take) {
    onChange({ ...sequence, takes: sequence.takes.map((current) => current.id === take.id ? take : current) });
  }

  function reorder(dropIndex: number) {
    if (dragIndex.current === null || dragIndex.current === dropIndex) return;
    const takes = [...sequence.takes];
    const [moved] = takes.splice(dragIndex.current, 1);
    takes.splice(dropIndex, 0, moved);
    dragIndex.current = null;
    onChange({ ...sequence, takes });
  }

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= sequence.takes.length) return;
    const takes = [...sequence.takes];
    [takes[index], takes[destination]] = [takes[destination], takes[index]];
    onChange({ ...sequence, takes });
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-100/65 p-2 sm:rounded-3xl sm:p-4">
      <div className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_1.5fr_auto] sm:items-start">
        <TextInput value={sequence.title} onChange={(event) => onChange({ ...sequence, title: event.target.value })} className="text-base font-semibold" />
        <TextArea value={sequence.notes} placeholder="Objetivo, contexto ou observações da sequência" className="min-h-11 py-2" onChange={(event) => onChange({ ...sequence, notes: event.target.value })} />
        <button type="button" onClick={onRemove} className="grid h-10 w-10 place-items-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remover ${sequence.title}`}><Trash2 size={17} /></button>
      </div>
      <div className="space-y-4">
        {sequence.takes.map((take, index) => (
          <TakeCard
            key={take.id}
            take={take}
            index={index}
            onChange={updateTake}
            onRemove={() => onChange({ ...sequence, takes: sequence.takes.filter((item) => item.id !== take.id) })}
            onDragStart={() => { dragIndex.current = index; }}
            onDrop={() => reorder(index)}
            onMoveUp={() => move(index, -1)}
            onMoveDown={() => move(index, 1)}
            canMoveUp={index > 0}
            canMoveDown={index < sequence.takes.length - 1}
          />
        ))}
      </div>
      <button type="button" onClick={() => onChange({ ...sequence, takes: [...sequence.takes, createTake(`Take ${String(sequence.takes.length + 1).padStart(2, "0")}`)] })} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"><Plus size={16} />Adicionar take</button>
    </section>
  );
}
