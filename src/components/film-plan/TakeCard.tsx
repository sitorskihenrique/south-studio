"use client";

import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Field, NumberInput, SelectInput, TextArea, TextInput } from "@/components/budget/BudgetFields";
import { createShot } from "@/lib/film-plan/defaults";
import { imageFilesToReferences } from "@/lib/film-plan/images";
import type { Take, TakePriority, TakeStatus } from "@/lib/film-plan/types";

const statuses: TakeStatus[] = ["Pendente", "Gravando", "Concluído", "Cancelado"];
const priorities: TakePriority[] = ["Essencial", "Importante", "Extra"];

export function TakeCard({
  take,
  index,
  onChange,
  onRemove,
  onDragStart,
  onDrop,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  take: Take;
  index: number;
  onChange: (take: Take) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  function patch(values: Partial<Take>) {
    onChange({ ...take, ...values });
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    try {
      patch({ images: [...take.images, ...(await imageFilesToReferences(files))] });
    } catch {
      window.alert("Não foi possível processar uma das imagens.");
    }
  }

  return (
    <article
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-lg hover:shadow-zinc-950/5"
    >
      <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-3">
        <span
          draggable
          data-testid={`drag-take-${take.id}`}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", take.id);
            onDragStart();
          }}
          className="grid h-9 w-7 shrink-0 cursor-grab place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing"
          title="Arrastar take"
          aria-label={`Arrastar ${take.title}`}
        >
          <GripVertical size={18} />
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-950 text-xs font-semibold text-white">
          {String(index + 1).padStart(2, "0")}
        </span>
        <TextInput value={take.title} onChange={(event) => patch({ title: event.target.value })} className="border-0 bg-transparent px-0 text-base font-semibold focus:ring-0" />
        <button type="button" onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Mover ${take.title} para cima`} title="Mover para cima" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-30">
          <ArrowUp size={16} />
        </button>
        <button type="button" onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Mover ${take.title} para baixo`} title="Mover para baixo" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-30">
          <ArrowDown size={16} />
        </button>
        <button type="button" onClick={onRemove} aria-label={`Remover ${take.title}`} title="Remover take" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>

      {take.images.length > 0 && (
        <div className="grid aspect-[16/7] grid-cols-3 gap-1 bg-zinc-950 p-1">
          {take.images.slice(0, 3).map((image, imageIndex) => (
            <div
              key={image.id}
              className={`group relative bg-cover bg-center ${imageIndex === 0 ? "col-span-2 row-span-2" : ""}`}
              style={{ backgroundImage: `url("${image.dataUrl}")` }}
              title={image.name}
            >
              <button
                type="button"
                onClick={() => patch({ images: take.images.filter((item) => item.id !== image.id) })}
                aria-label={`Remover imagem ${image.name}`}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Horário"><TextInput type="time" value={take.time} onChange={(event) => patch({ time: event.target.value })} /></Field>
          <Field label="Local"><TextInput value={take.location} placeholder="Calçadão, estúdio..." onChange={(event) => patch({ location: event.target.value })} /></Field>
          <Field label="Ambiente"><TextInput value={take.environment} placeholder="EXT · Rua" onChange={(event) => patch({ environment: event.target.value })} /></Field>
          <Field label="Tempo estimado"><NumberInput value={take.estimatedMinutes} suffix="min" onValueChange={(estimatedMinutes) => patch({ estimatedMinutes })} /></Field>
          <Field label="Elenco"><TextInput value={take.cast} onChange={(event) => patch({ cast: event.target.value })} /></Field>
          <Field label="Look"><TextInput value={take.look} onChange={(event) => patch({ look: event.target.value })} /></Field>
          <Field label="Status"><SelectInput value={take.status} onChange={(event) => patch({ status: event.target.value as TakeStatus })}>{statuses.map((status) => <option key={status}>{status}</option>)}</SelectInput></Field>
          <Field label="Prioridade"><SelectInput value={take.priority} onChange={(event) => patch({ priority: event.target.value as TakePriority })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</SelectInput></Field>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Field label="Descrição da cena"><TextArea value={take.description} onChange={(event) => patch({ description: event.target.value })} /></Field>
          <Field label="Arte / objetos / texto"><TextArea value={take.artAndText} onChange={(event) => patch({ artAndText: event.target.value })} /></Field>
          <Field label="Equipamento"><TextArea value={take.equipment} placeholder="FX30 · 30mm · Gimbal" onChange={(event) => patch({ equipment: event.target.value })} /></Field>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_220px]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-800">Shotlist</p>
              <button type="button" onClick={() => patch({ shotlist: [...take.shotlist, createShot("Novo plano")] })} className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700"><Plus size={14} />Adicionar plano</button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {take.shotlist.map((shot) => (
                <label key={shot.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${shot.completed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-zinc-50 text-zinc-700"}`}>
                  <input type="checkbox" checked={shot.completed} onChange={(event) => patch({ shotlist: take.shotlist.map((item) => item.id === shot.id ? { ...item, completed: event.target.checked } : item) })} className="h-4 w-4 accent-emerald-600" />
                  <input value={shot.label} onChange={(event) => patch({ shotlist: take.shotlist.map((item) => item.id === shot.id ? { ...item, label: event.target.value } : item) })} className="min-w-0 flex-1 bg-transparent outline-none" />
                  <button type="button" onClick={() => patch({ shotlist: take.shotlist.filter((item) => item.id !== shot.id) })} aria-label={`Remover ${shot.label}`} className="text-zinc-400 hover:text-red-600"><X size={14} /></button>
                </label>
              ))}
            </div>
          </div>
          <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-violet-300 bg-violet-50/60 p-4 text-center transition hover:bg-violet-50">
            <ImagePlus size={22} className="text-violet-700" />
            <span className="mt-3 text-sm font-semibold text-violet-800">Adicionar referências</span>
            <span className="mt-1 text-xs text-violet-600">Storyboard, luz ou frame</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => upload(event.target.files)} />
          </label>
        </div>
      </div>
    </article>
  );
}
