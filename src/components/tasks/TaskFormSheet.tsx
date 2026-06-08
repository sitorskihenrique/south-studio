"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Field, SelectInput, TextArea, TextInput } from "@/components/budget/BudgetFields";
import {
  taskCategories,
  taskDays,
  taskPriorities,
  taskStatuses,
  taskTimeOptions,
  type TaskDraft,
} from "@/lib/tasks/types";

export function TaskFormSheet({
  open,
  draft,
  editing,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  draft: TaskDraft;
  editing: boolean;
  onChange: (draft: TaskDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/45 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={editing ? "Editar tarefa" : "Nova tarefa"}>
      <button type="button" aria-label="Fechar painel de tarefa" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default" />
      <form
        onSubmit={(event) => { event.preventDefault(); onSubmit(); }}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Organização semanal</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">{editing ? "Editar tarefa" : "Nova tarefa"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-100 text-zinc-600"><X size={19} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Título"><TextInput autoFocus required value={draft.title} placeholder="Ex.: Confirmar equipe da gravação" onChange={(event) => onChange({ ...draft, title: event.target.value })} /></Field>
            </div>
            <Field label="Dia da semana"><SelectInput value={draft.day} onChange={(event) => onChange({ ...draft, day: event.target.value as TaskDraft["day"] })}>{taskDays.map(option)}</SelectInput></Field>
            <Field label="Categoria"><SelectInput value={draft.category} onChange={(event) => onChange({ ...draft, category: event.target.value as TaskDraft["category"] })}>{taskCategories.map(option)}</SelectInput></Field>
            <Field label="Prioridade"><SelectInput value={draft.priority} onChange={(event) => onChange({ ...draft, priority: event.target.value as TaskDraft["priority"] })}>{taskPriorities.map(option)}</SelectInput></Field>
            <Field label="Status"><SelectInput value={draft.status} onChange={(event) => onChange({ ...draft, status: event.target.value as TaskDraft["status"] })}>{taskStatuses.map(option)}</SelectInput></Field>
            <Field label="Tempo estimado"><SelectInput value={draft.estimatedTime} onChange={(event) => onChange({ ...draft, estimatedTime: event.target.value as TaskDraft["estimatedTime"] })}>{taskTimeOptions.map(option)}</SelectInput></Field>
            {draft.estimatedTime === "Personalizado" && <Field label="Minutos"><TextInput type="number" min="1" value={draft.customMinutes} onChange={(event) => onChange({ ...draft, customMinutes: Math.max(1, Number(event.target.value) || 1) })} /></Field>}
            <div className="sm:col-span-2">
              <Field label="Observações"><TextArea value={draft.notes} placeholder="Detalhes, contatos ou lembretes importantes" onChange={(event) => onChange({ ...draft, notes: event.target.value })} /></Field>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-600">Cancelar</button>
          <button type="submit" className="min-h-12 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white">{editing ? "Salvar alterações" : "Criar tarefa"}</button>
        </div>
      </form>
    </div>
  );
}

function option(value: string) {
  return <option key={value} value={value}>{value}</option>;
}
