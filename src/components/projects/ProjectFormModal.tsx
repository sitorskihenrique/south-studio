"use client";

import { X } from "lucide-react";
import { Field, SelectInput, TextArea, TextInput } from "@/components/budget/BudgetFields";
import { projectPriorities, projectStatuses, type ProjectDraft } from "@/lib/projects/types";

export function ProjectFormModal({
  open,
  editing,
  draft,
  tagsText,
  onChange,
  onTagsChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: boolean;
  draft: ProjectDraft;
  tagsText: string;
  onChange: (draft: ProjectDraft) => void;
  onTagsChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/50 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={editing ? "Editar projeto" : "Criar projeto"}>
      <button type="button" aria-label="Fechar criação de projeto" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default" />
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-xl sm:rounded-[28px]">
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-6">
          <div><p className="text-xs font-semibold uppercase text-zinc-400">Projetos</p><h2 className="mt-1 text-xl font-semibold text-zinc-950">{editing ? "Editar projeto" : "Criar projeto"}</h2></div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-11 w-11 place-items-center rounded-full bg-zinc-100 text-zinc-600"><X size={18} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Nome do projeto"><TextInput autoFocus required value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} placeholder="Ex.: Filme institucional" /></Field></div>
            <Field label="Cliente"><TextInput value={draft.client} onChange={(event) => onChange({ ...draft, client: event.target.value })} placeholder="Nome do cliente" /></Field>
            <Field label="Prazo"><TextInput type="date" value={draft.deadline} onChange={(event) => onChange({ ...draft, deadline: event.target.value })} /></Field>
            <Field label="Status"><SelectInput value={draft.status} onChange={(event) => onChange({ ...draft, status: event.target.value as ProjectDraft["status"] })}>{projectStatuses.map(option)}</SelectInput></Field>
            <Field label="Prioridade"><SelectInput value={draft.priority} onChange={(event) => onChange({ ...draft, priority: event.target.value as ProjectDraft["priority"] })}>{projectPriorities.map(option)}</SelectInput></Field>
            <div className="sm:col-span-2"><Field label="Descrição breve"><TextArea value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} placeholder="Contexto essencial do projeto" /></Field></div>
            <div className="sm:col-span-2"><Field label="Tags" hint="Separe por vírgulas"><TextInput value={tagsText} onChange={(event) => onTagsChange(event.target.value)} placeholder="Campanha, Reels, Estúdio" /></Field></div>
          </div>
        </div>
        <footer className="grid grid-cols-2 gap-3 border-t border-zinc-200 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:flex sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="min-h-12 rounded-2xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-600">Cancelar</button>
          <button type="submit" className="min-h-12 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white">{editing ? "Salvar projeto" : "Criar projeto"}</button>
        </footer>
      </form>
    </div>
  );
}

function option(value: string) {
  return <option key={value} value={value}>{value}</option>;
}
