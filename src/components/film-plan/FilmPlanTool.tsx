"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Copy, Film, LayoutList, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { Field, TextArea, TextInput } from "@/components/budget/BudgetFields";
import { createDefaultFilmPlan, createFilmDay, createScriptBlock, createSequence } from "@/lib/film-plan/defaults";
import { filmPlanDraftKey, readFilmPlanStorage, savedFilmPlansKey, toSavedFilmPlan, upsertFilmPlan, writeFilmPlanStorage } from "@/lib/film-plan/storage";
import type { FilmDay, FilmPlan, SavedFilmPlan, ScriptBlock, Sequence } from "@/lib/film-plan/types";
import { deleteCloudItem, readCloudItems, upsertCloudItem } from "@/lib/supabase/data";
import { FilmPlanSummary } from "./FilmPlanSummary";
import { PlanSection } from "./PlanSection";
import { SavedFilmPlansView } from "./SavedFilmPlansView";
import { SequenceBoard } from "./SequenceBoard";
import { TimelineView } from "./TimelineView";

type View = "editor" | "timeline" | "saved";

export function FilmPlanTool() {
  const [plan, setPlan] = useState<FilmPlan>(() => createDefaultFilmPlan());
  const [savedPlans, setSavedPlans] = useState<SavedFilmPlan[]>([]);
  const [view, setView] = useState<View>("editor");
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("Rascunho salvo localmente");
  const [storageLabel, setStorageLabel] = useState("Modo local");

  const activeDay = useMemo(() => plan.days.find((day) => day.id === plan.activeDayId) || plan.days[0], [plan]);

  useEffect(() => {
    let mounted = true;
    const draft = readFilmPlanStorage<Partial<FilmPlan> | null>(filmPlanDraftKey, null);
    if (draft) setPlan(normalizePlan(draft));
    setSavedPlans(readFilmPlanStorage<SavedFilmPlan[]>(savedFilmPlansKey, []));
    setReady(true);
    readCloudItems<SavedFilmPlan>("film_plans").then((result) => {
      if (!mounted) return;
      if (!result.authenticated) {
        setStorageLabel("Modo local");
        return;
      }
      setStorageLabel(result.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
      if (result.ok && result.items.length) setSavedPlans(result.items);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => {
      const ok = writeFilmPlanStorage(filmPlanDraftKey, { ...plan, updatedAt: new Date().toISOString() });
      if (dirty) setMessage(ok ? "Alterações preservadas como rascunho" : "Armazenamento cheio. Remova algumas imagens.");
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [dirty, plan, ready]);

  function update(updater: (current: FilmPlan) => FilmPlan) {
    setDirty(true);
    setMessage("Alterações não salvas no plano");
    setPlan(updater);
  }

  function updateDay(day: FilmDay) {
    update((current) => ({ ...current, days: current.days.map((item) => item.id === day.id ? day : item) }));
  }

  function newPlan() {
    if (dirty && !window.confirm("Você tem alterações não salvas. Deseja continuar?")) return;
    setPlan(createDefaultFilmPlan(crypto.randomUUID()));
    setDirty(false);
    setMessage("Novo plano iniciado");
    setView("editor");
  }

  async function savePlan() {
    const saved = toSavedFilmPlan(plan);
    const next = upsertFilmPlan(savedPlans, saved);
    const ok = writeFilmPlanStorage(savedFilmPlansKey, next);
    if (!ok) {
      setMessage("Não foi possível salvar. O armazenamento local pode estar cheio.");
      return;
    }
    setSavedPlans(next);
    setPlan(saved.plan);
    writeFilmPlanStorage(filmPlanDraftKey, saved.plan);
    const cloud = await upsertCloudItem("film_plans", saved, saved.projectName);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
    setDirty(false);
    setMessage(cloud.authenticated && cloud.ok ? "Plano salvo na sua conta." : "Plano salvo localmente.");
  }

  async function duplicate(source = plan) {
    const copy = normalizePlan({ ...source, id: crypto.randomUUID(), projectName: `Cópia de ${source.projectName}`, createdAt: "", updatedAt: "" });
    const saved = toSavedFilmPlan(copy);
    const next = upsertFilmPlan(savedPlans, saved);
    if (!writeFilmPlanStorage(savedFilmPlansKey, next)) return setMessage("Não foi possível duplicar. O armazenamento local pode estar cheio.");
    setSavedPlans(next);
    setPlan(saved.plan);
    const cloud = await upsertCloudItem("film_plans", saved, saved.projectName);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
    setDirty(false);
    setMessage(cloud.authenticated && cloud.ok ? "Plano duplicado na sua conta." : "Plano duplicado localmente.");
    setView("editor");
  }

  function openSaved(saved: SavedFilmPlan) {
    setPlan(normalizePlan(saved.plan));
    setDirty(false);
    setMessage("Editando plano salvo");
    setView("editor");
  }

  async function deleteSaved(saved: SavedFilmPlan) {
    if (!window.confirm("Tem certeza que deseja excluir este plano de filmagem?")) return;
    const next = savedPlans.filter((item) => item.id !== saved.id);
    setSavedPlans(next);
    writeFilmPlanStorage(savedFilmPlansKey, next);
    const cloud = await deleteCloudItem("film_plans", saved.id);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
  }

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-8 lg:px-10 lg:py-9 fade-in">
        <header className="studio-card rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase text-zinc-500"><Sparkles size={14} />Direção visual</div><h1 className="text-4xl font-semibold text-zinc-950 sm:text-6xl">Plano de Filmagem</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">Shotlist, referências, timeline e checklist de takes em uma experiência de set.</p></div>
            {view !== "saved" && <div className="flex flex-wrap gap-2"><Action icon={CalendarPlus} label="Novo plano" onClick={newPlan} /><Action icon={Save} label="Salvar plano" onClick={savePlan} primary /><Action icon={Copy} label="Duplicar" onClick={() => duplicate()} /></div>}
          </div>
          <div className="mt-6 flex w-full gap-1 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-1 sm:w-fit"><Tab icon={Film} label="Editor" active={view === "editor"} onClick={() => setView("editor")} /><Tab icon={LayoutList} label="Timeline" active={view === "timeline"} onClick={() => setView("timeline")} /><Tab icon={LayoutList} label={`Planos (${savedPlans.length})`} active={view === "saved"} onClick={() => setView("saved")} /></div>
        </header>

        {view === "saved" ? <div className="mt-6"><SavedFilmPlansView plans={savedPlans} onOpen={openSaved} onDuplicate={(saved) => duplicate(saved.plan)} onDelete={deleteSaved} /></div> : (
          <div className="mt-5">
            <div className="mb-5 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-medium text-zinc-500">{message} · {storageLabel}</div>
            <DaySelector plan={plan} update={update} />
            {view === "timeline" ? <div className="mt-5"><TimelineView day={activeDay} /></div> : (
              <div className="mt-5 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <main className="order-2 space-y-5 xl:order-1">
                  <ProjectInfo plan={plan} update={update} />
                  <ScriptEditor scripts={plan.scripts} onChange={(scripts) => update((current) => ({ ...current, scripts }))} />
                  <ScheduleEditor day={activeDay} onChange={updateDay} />
                  <PlanSection eyebrow="Plano visual" title="Sequências e Takes" description="Arraste os cards para reorganizar os takes dentro de cada sequência." action={<button type="button" onClick={() => updateDay({ ...activeDay, sequences: [...activeDay.sequences, createSequence(`Sequência ${String(activeDay.sequences.length + 1).padStart(2, "0")}`)] })} className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-3.5 text-sm font-semibold text-white"><Plus size={16} />Nova sequência</button>}>
                    <div className="space-y-5">{activeDay.sequences.map((sequence) => <SequenceBoard key={sequence.id} sequence={sequence} onChange={(changed) => updateDay({ ...activeDay, sequences: activeDay.sequences.map((item) => item.id === changed.id ? changed : item) })} onRemove={() => updateDay({ ...activeDay, sequences: activeDay.sequences.filter((item) => item.id !== sequence.id) })} />)}</div>
                  </PlanSection>
                </main>
                <FilmPlanSummary plan={plan} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectInfo({ plan, update }: { plan: FilmPlan; update: (fn: (current: FilmPlan) => FilmPlan) => void }) {
  const fields: { key: keyof Pick<FilmPlan, "projectName" | "client" | "agency" | "duration" | "formats" | "weather" | "date" | "director" | "producer">; label: string; type?: string }[] = [{ key: "projectName", label: "Projeto" }, { key: "client", label: "Cliente" }, { key: "agency", label: "Agência" }, { key: "duration", label: "Duração" }, { key: "formats", label: "Formatos" }, { key: "weather", label: "Meteorologia" }, { key: "date", label: "Data", type: "date" }, { key: "director", label: "Diretor" }, { key: "producer", label: "Produtor" }];
  return <PlanSection eyebrow="Projeto" title="Informações gerais" description="Dados centrais do plano, conforme o modelo operacional da South."><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{fields.map((field) => <Field key={field.key} label={field.label}><TextInput type={field.type} value={plan[field.key]} onChange={(event) => update((current) => ({ ...current, [field.key]: event.target.value }))} /></Field>)}</div></PlanSection>;
}

function ScriptEditor({ scripts, onChange }: { scripts: ScriptBlock[]; onChange: (scripts: ScriptBlock[]) => void }) {
  return <PlanSection eyebrow="Roteiro descritivo" title="Logline, roteiro e CTA" description="Use múltiplos blocos para organizar as mensagens e entregas."><div className="space-y-4">{scripts.map((script, index) => <div key={script.id} className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 xl:grid-cols-[1fr_1.6fr_1fr_40px]"><Field label={`Logline ${index + 1}`}><TextArea value={script.logline} onChange={(event) => onChange(scripts.map((item) => item.id === script.id ? { ...item, logline: event.target.value } : item))} /></Field><Field label="Roteiro"><TextArea value={script.script} onChange={(event) => onChange(scripts.map((item) => item.id === script.id ? { ...item, script: event.target.value } : item))} /></Field><Field label="CTA"><TextArea value={script.cta} onChange={(event) => onChange(scripts.map((item) => item.id === script.id ? { ...item, cta: event.target.value } : item))} /></Field><button type="button" onClick={() => onChange(scripts.filter((item) => item.id !== script.id))} aria-label={`Remover bloco ${index + 1}`} className="grid h-10 w-10 place-items-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></div>)}</div><button type="button" onClick={() => onChange([...scripts, createScriptBlock()])} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3.5 text-sm font-semibold text-zinc-600"><Plus size={16} />Adicionar bloco</button></PlanSection>;
}

function ScheduleEditor({ day, onChange }: { day: FilmDay; onChange: (day: FilmDay) => void }) {
  const items: { key: keyof FilmDay["schedule"]; label: string }[] = [{ key: "preparation", label: "Preparação" }, { key: "cameraOpen", label: "Abertura de câmera" }, { key: "lunch", label: "Almoço" }, { key: "lunchReturn", label: "Volta rodando" }, { key: "wrapStart", label: "Desprodução" }, { key: "dayEnd", label: "Fim da diária" }];
  return <PlanSection eyebrow="Ordem do dia" title="Cronograma da diária" description="Marcos operacionais principais da filmagem."><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Field key={item.key} label={item.label}><TextInput type="time" value={day.schedule[item.key]} onChange={(event) => onChange({ ...day, schedule: { ...day.schedule, [item.key]: event.target.value } })} /></Field>)}</div></PlanSection>;
}

function DaySelector({ plan, update }: { plan: FilmPlan; update: (fn: (current: FilmPlan) => FilmPlan) => void }) {
  return <div className="flex flex-wrap gap-2 rounded-3xl border border-zinc-200 bg-white p-3">{plan.days.map((day) => <button key={day.id} type="button" onClick={() => update((current) => ({ ...current, activeDayId: day.id }))} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${plan.activeDayId === day.id ? "bg-violet-600 text-white" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"}`}>{day.label}</button>)}<button type="button" onClick={() => { const day = createFilmDay(`Diária ${String(plan.days.length + 1).padStart(2, "0")}`); update((current) => ({ ...current, days: [...current.days, day], activeDayId: day.id })); }} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600"><Plus size={15} />Adicionar diária</button></div>;
}

function normalizePlan(stored: Partial<FilmPlan>): FilmPlan {
  const defaults = createDefaultFilmPlan(stored.id || crypto.randomUUID());
  const days = stored.days?.length ? stored.days : defaults.days;
  return { ...defaults, ...stored, scripts: stored.scripts || defaults.scripts, days, activeDayId: days.some((day) => day.id === stored.activeDayId) ? String(stored.activeDayId) : days[0].id };
}

function Action({ icon: Icon, label, onClick, primary }: { icon: typeof Save; label: string; onClick: () => void; primary?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${primary ? "bg-zinc-950 text-white hover:bg-zinc-800" : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"}`}><Icon size={17} />{label}</button>;
}
function Tab({ icon: Icon, label, active, onClick }: { icon: typeof Film; label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-11 min-w-fit items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${active ? "bg-zinc-950 text-white" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"}`}><Icon size={17} />{label}</button>;
}
