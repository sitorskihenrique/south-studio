"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarPlus, Copy, Film, LayoutList, Plus, Save, Trash2 } from "lucide-react";
import { Field, TextArea, TextInput } from "@/components/budget/BudgetFields";
import { createDefaultFilmPlan, createFilmDay, createScriptBlock, createSequence, createTake } from "@/lib/film-plan/defaults";
import { filmPlanDraftKey, readFilmPlanStorage, savedFilmPlansKey, toSavedFilmPlan, upsertFilmPlan, writeFilmPlanStorage } from "@/lib/film-plan/storage";
import type { FilmDay, FilmPlan, SavedFilmPlan, ScriptBlock, Sequence, Take } from "@/lib/film-plan/types";
import { deleteCloudItem, readCloudItems, upsertCloudItem } from "@/lib/supabase/data";
import { FilmPlanSummary } from "./FilmPlanSummary";
import { PlanSection } from "./PlanSection";
import { SavedFilmPlansView } from "./SavedFilmPlansView";
import { SequenceBoard } from "./SequenceBoard";
import { TimelineView } from "./TimelineView";
import { ProjectLinkField } from "@/components/projects/ProjectLinkField";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { PremiumPreviewDialog } from "@/components/PremiumPreviewDialog";
import { trackUsageEvent } from "@/lib/analytics/usage";

type View = "editor" | "timeline" | "saved";

export function FilmPlanTool() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project") || "";
  const [plan, setPlan] = useState<FilmPlan>(() => createDefaultFilmPlan());
  const [savedPlans, setSavedPlans] = useState<SavedFilmPlan[]>([]);
  const [view, setView] = useState<View>("editor");
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("Rascunho salvo localmente");
  const [storageLabel, setStorageLabel] = useState("Modo local");
  const [mode, setMode] = useState<"simple" | "complete">("simple");
  const [premiumPreview, setPremiumPreview] = useState(false);

  const activeDay = useMemo(() => plan.days.find((day) => day.id === plan.activeDayId) || plan.days[0], [plan]);

  useEffect(() => {
    let mounted = true;
    const draft = readFilmPlanStorage<Partial<FilmPlan> | null>(filmPlanDraftKey, null);
    const localSaved = readFilmPlanStorage<SavedFilmPlan[]>(savedFilmPlansKey, []);
    if (!initialProjectId && draft) setPlan(normalizePlan(draft));
    else if (initialProjectId) setPlan((current) => ({ ...current, projectId: initialProjectId }));
    setSavedPlans(localSaved);
    setReady(true);
    readCloudItems<SavedFilmPlan>("film_plans").then((result) => {
      if (!mounted) return;
      if (!result.authenticated) {
        setStorageLabel("Modo local");
        return;
      }
      setStorageLabel(result.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
      if (result.ok) {
        setSavedPlans(result.items);
        writeFilmPlanStorage(savedFilmPlansKey, result.items);
        const linked = initialProjectId
          ? result.items.find((item) => (item.projectId || item.plan?.projectId) === initialProjectId)
          : null;
        if (linked) setPlan(normalizePlan(linked.plan));
      }
    });
    return () => { mounted = false; };
  }, [initialProjectId]);

  useEffect(() => {
    if (!ready) return;
    const refresh = () => {
      readCloudItems<SavedFilmPlan>("film_plans", { force: true }).then((result) => {
        if (!result.authenticated || !result.ok) return;
        setSavedPlans(result.items);
        writeFilmPlanStorage(savedFilmPlansKey, result.items);
        if (!dirty) {
          const active = result.items.find((item) => item.id === plan.id);
          if (active) setPlan(normalizePlan(active.plan));
        }
      });
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [dirty, plan.id, ready]);

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
    setPlan({ ...createDefaultFilmPlan(crypto.randomUUID()), projectId: initialProjectId });
    setDirty(false);
    setMessage("Novo plano iniciado");
    setView("editor");
  }

  async function savePlan() {
    const saved = toSavedFilmPlan(plan);
    const next = upsertFilmPlan(savedPlans, saved);
    setSavedPlans(next);
    setPlan(saved.plan);
    const cloud = await upsertCloudItem("film_plans", saved, saved.projectName);
    const ok = writeFilmPlanStorage(savedFilmPlansKey, next);
    writeFilmPlanStorage(filmPlanDraftKey, saved.plan);
    if (!ok && !cloud.ok) {
      setMessage("Não foi possível salvar. Tente novamente.");
      return;
    }
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
    setDirty(false);
    setMessage(cloud.authenticated && cloud.ok ? "Plano salvo na sua conta." : "Plano salvo localmente.");
    if (cloud.authenticated && (cloud.ok || cloud.queued)) void trackUsageEvent("film_plan_saved", "film_plans");
  }

  async function duplicate(source = plan) {
    const copy = normalizePlan({ ...source, id: crypto.randomUUID(), projectName: `Cópia de ${source.projectName}`, createdAt: "", updatedAt: "" });
    const saved = toSavedFilmPlan(copy);
    const next = upsertFilmPlan(savedPlans, saved);
    setSavedPlans(next);
    setPlan(saved.plan);
    const cloud = await upsertCloudItem("film_plans", saved, saved.projectName);
    writeFilmPlanStorage(savedFilmPlansKey, next);
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
    const cloud = await deleteCloudItem("film_plans", saved.id);
    writeFilmPlanStorage(savedFilmPlansKey, next);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
  }

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-8 lg:px-10 lg:py-9 fade-in">
        <ToolHeader
          eyebrow="Produção"
          title="Plano de Filmagem"
          description="Shotlist, referências, timeline e checklist de takes em uma experiência integrada de set."
          actions={view !== "saved" ? <><Action icon={CalendarPlus} label="Novo plano" onClick={newPlan} /><Action icon={Save} label="Salvar plano" onClick={savePlan} primary /><Action icon={Copy} label="Duplicar" onClick={() => duplicate()} /></> : undefined}
        >
          <div className="mt-7 flex w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.06] p-1 sm:w-fit"><Tab icon={Film} label="Editor" active={view === "editor"} onClick={() => setView("editor")} /><Tab icon={LayoutList} label="Timeline" active={view === "timeline"} onClick={() => setView("timeline")} /><Tab icon={LayoutList} label={`Planos (${savedPlans.length})`} active={view === "saved"} onClick={() => setView("saved")} /></div>
          {view === "editor" && <div className="hide-scrollbar mt-3 flex w-full gap-1 overflow-x-auto rounded-2xl bg-white/[0.06] p-1 sm:w-fit"><Mode active={mode === "simple"} label="Plano simples" onClick={() => setMode("simple")} /><Mode active={false} label="Plano completo" premium onClick={() => setPremiumPreview(true)} /></div>}
        </ToolHeader>

        {view === "saved" ? <div className="mt-6"><SavedFilmPlansView plans={savedPlans} onOpen={openSaved} onDuplicate={(saved) => duplicate(saved.plan)} onDelete={deleteSaved} /></div> : (
          <div className="mt-5">
            <div className="mb-5 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-medium text-zinc-500">{message} · {storageLabel}</div>
            {mode === "complete" && <DaySelector plan={plan} update={update} />}
            {view === "timeline" ? <div className="mt-5"><TimelineView day={activeDay} /></div> : mode === "simple" ? <SimplePlan plan={plan} day={activeDay} update={update} updateDay={updateDay} /> : (
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
      <PremiumPreviewDialog
        open={premiumPreview}
        title="Plano de Filmagem Completo"
        description="Sequências avançadas, cronograma completo, referências e direção visual estarão disponíveis na experiência Premium."
        onClose={() => setPremiumPreview(false)}
      />
    </section>
  );
}

function SimplePlan({ plan, day, update, updateDay }: { plan: FilmPlan; day: FilmDay; update: (fn: (current: FilmPlan) => FilmPlan) => void; updateDay: (day: FilmDay) => void }) {
  const sequence = day.sequences[0] || createSequence("Takes");
  const takes = sequence.takes || [];
  const updateTakes = (next: Take[]) => updateDay({ ...day, sequences: day.sequences.length ? day.sequences.map((item, index) => index === 0 ? { ...item, takes: next } : item) : [{ ...sequence, takes: next }] });
  return <div className="mt-5 space-y-5"><PlanSection eyebrow="Plano simples" title="Dados rápidos" description="O contexto essencial antes de organizar os takes."><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><ProjectLinkField value={plan.projectId} onChange={(projectId) => update((current) => ({ ...current, projectId }))} /></div><Field label="Nome do projeto"><TextInput value={plan.projectName} onChange={(event) => update((current) => ({ ...current, projectName: event.target.value }))} /></Field><Field label="Cliente"><TextInput value={plan.client} onChange={(event) => update((current) => ({ ...current, client: event.target.value }))} /></Field><Field label="Data"><TextInput type="date" value={day.date || plan.date} onChange={(event) => { update((current) => ({ ...current, date: event.target.value })); updateDay({ ...day, date: event.target.value }); }} /></Field><Field label="Local"><TextInput value={plan.simpleLocation} onChange={(event) => update((current) => ({ ...current, simpleLocation: event.target.value }))} /></Field></div></PlanSection><PlanSection eyebrow="Shotlist" title="Takes" description="Cada card representa uma cena ou take objetivo." action={<button type="button" onClick={() => updateTakes([...takes, createTake(`Take ${takes.length + 1}`, "09:00")])} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white"><Plus size={16} />Adicionar take</button>}><div className="grid gap-4 lg:grid-cols-2">{takes.map((take, index) => <SimpleTakeCard key={take.id} take={take} index={index} onChange={(changed) => updateTakes(takes.map((item) => item.id === changed.id ? changed : item))} onDuplicate={() => updateTakes([...takes.slice(0, index + 1), { ...take, id: crypto.randomUUID(), title: `${take.title} cópia`, images: [] }, ...takes.slice(index + 1)])} onRemove={() => updateTakes(takes.filter((item) => item.id !== take.id))} />)}</div>{!takes.length && <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">Adicione o primeiro take para começar.</p>}</PlanSection><EquipmentChecklist plan={plan} update={update} /><PlanSection eyebrow="Fechamento" title="Observações gerais" description="Informações que precisam acompanhar todo o plano."><TextArea value={plan.simpleNotes} onChange={(event) => update((current) => ({ ...current, simpleNotes: event.target.value }))} placeholder="Orientações gerais, cuidados e lembretes" /></PlanSection></div>;
}

const shotTypes = ["Plano aberto", "Plano médio", "Plano fechado", "Close", "Detalhe", "Movimento", "Drone", "Outro"];

function SimpleTakeCard({ take, index, onChange, onDuplicate, onRemove }: { take: Take; index: number; onChange: (take: Take) => void; onDuplicate: () => void; onRemove: () => void }) {
  const selected = new Set((take.shotlist || []).filter((shot) => shot.completed).map((shot) => shot.label));
  function toggleShot(label: string) {
    const found = (take.shotlist || []).find((shot) => shot.label === label);
    onChange({ ...take, shotlist: found ? take.shotlist.map((shot) => shot.label === label ? { ...shot, completed: !shot.completed } : shot) : [...(take.shotlist || []), { id: crypto.randomUUID(), label, completed: true }] });
  }
  return <article className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase text-zinc-400">Take {index + 1}</p><div className="flex gap-2"><button type="button" onClick={onDuplicate} aria-label={`Duplicar take ${index + 1}`} className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-100 text-zinc-600"><Copy size={15} /></button><button type="button" onClick={onRemove} aria-label={`Remover take ${index + 1}`} className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 size={15} /></button></div></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Nome do take / cena"><TextInput value={take.title} onChange={(event) => onChange({ ...take, title: event.target.value })} /></Field><Field label="Horário"><TextInput type="time" value={take.time} onChange={(event) => onChange({ ...take, time: event.target.value })} /></Field><Field label="Local"><TextInput value={take.location} onChange={(event) => onChange({ ...take, location: event.target.value })} /></Field><Field label="Equipamento usado"><TextInput value={take.equipment} onChange={(event) => onChange({ ...take, equipment: event.target.value })} /></Field><div className="sm:col-span-2"><Field label="Descrição da cena"><TextArea value={take.description} onChange={(event) => onChange({ ...take, description: event.target.value })} /></Field></div><div className="sm:col-span-2"><Field label="Texto objetivo da cena"><TextArea value={take.artAndText} onChange={(event) => onChange({ ...take, artAndText: event.target.value })} /></Field></div><div className="sm:col-span-2"><p className="mb-2 text-xs font-semibold text-zinc-500">Tipos de plano</p><div className="flex flex-wrap gap-2">{shotTypes.map((type) => <button key={type} type="button" onClick={() => toggleShot(type)} className={`min-h-10 rounded-full border px-3 text-xs font-semibold ${selected.has(type) ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 text-zinc-600"}`}>{type}</button>)}</div></div><div className="sm:col-span-2"><Field label="Observações"><TextArea value={take.look} onChange={(event) => onChange({ ...take, look: event.target.value })} /></Field></div></div></article>;
}

function EquipmentChecklist({ plan, update }: { plan: FilmPlan; update: (fn: (current: FilmPlan) => FilmPlan) => void }) {
  const [newItem, setNewItem] = useState("");
  const items = plan.equipmentChecklist || [];
  function add() {
    const label = newItem.trim();
    if (!label) return;
    update((current) => ({ ...current, equipmentChecklist: [...(current.equipmentChecklist || []), { id: crypto.randomUUID(), label, checked: false, custom: true }] }));
    setNewItem("");
  }
  return <PlanSection eyebrow="Produção" title="Checklist de equipamentos" description="Marque o que já está separado para a gravação."><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <label key={item.id} className="flex min-h-12 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700"><input type="checkbox" checked={item.checked} onChange={() => update((current) => ({ ...current, equipmentChecklist: (current.equipmentChecklist || []).map((currentItem) => currentItem.id === item.id ? { ...currentItem, checked: !currentItem.checked } : currentItem) }))} className="h-5 w-5 accent-zinc-950" /><span className="min-w-0 flex-1">{item.label}</span>{item.custom && <button type="button" onClick={(event) => { event.preventDefault(); update((current) => ({ ...current, equipmentChecklist: (current.equipmentChecklist || []).filter((currentItem) => currentItem.id !== item.id) })); }} aria-label={`Remover ${item.label}`} className="grid h-9 w-9 place-items-center rounded-xl text-red-500"><Trash2 size={14} /></button>}</label>)}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><TextInput value={newItem} onChange={(event) => setNewItem(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} placeholder="Adicionar equipamento personalizado" /><button type="button" onClick={add} className="min-h-11 shrink-0 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white">Adicionar</button></div></PlanSection>;
}

function Mode({ active, label, premium = false, onClick }: { active: boolean; label: string; premium?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-transparent px-4 text-xs font-semibold transition ${premium ? "studio-premium" : active ? "bg-white text-[#0b0e15] shadow-sm" : "text-white/48"}`}>{label}{premium && <span className="studio-premium-badge rounded-full px-2 py-0.5 text-[9px] font-bold uppercase">Premium</span>}</button>;
}

function ProjectInfo({ plan, update }: { plan: FilmPlan; update: (fn: (current: FilmPlan) => FilmPlan) => void }) {
  const fields: { key: keyof Pick<FilmPlan, "projectName" | "client" | "agency" | "duration" | "formats" | "weather" | "date" | "director" | "producer">; label: string; type?: string }[] = [{ key: "projectName", label: "Projeto" }, { key: "client", label: "Cliente" }, { key: "agency", label: "Agência" }, { key: "duration", label: "Duração" }, { key: "formats", label: "Formatos" }, { key: "weather", label: "Meteorologia" }, { key: "date", label: "Data", type: "date" }, { key: "director", label: "Diretor" }, { key: "producer", label: "Produtor" }];
  return <PlanSection eyebrow="Projeto" title="Informações gerais" description="Dados centrais para orientar o planejamento da produção."><div className="mb-5"><ProjectLinkField value={plan.projectId} onChange={(projectId, project) => update((current) => ({ ...current, projectId, projectName: project && (!current.projectName || current.projectName === "Novo Plano de Filmagem") ? project.title : current.projectName, client: project && !current.client ? project.client : current.client }))} /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{fields.map((field) => <Field key={field.key} label={field.label}><TextInput type={field.type} value={plan[field.key]} onChange={(event) => update((current) => ({ ...current, [field.key]: event.target.value }))} /></Field>)}</div></PlanSection>;
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
  return { ...defaults, ...stored, equipmentChecklist: Array.isArray(stored.equipmentChecklist) ? stored.equipmentChecklist : defaults.equipmentChecklist, scripts: Array.isArray(stored.scripts) ? stored.scripts : defaults.scripts, days, activeDayId: days.some((day) => day.id === stored.activeDayId) ? String(stored.activeDayId) : days[0].id };
}

function Action({ icon: Icon, label, onClick, primary }: { icon: typeof Save; label: string; onClick: () => void; primary?: boolean }) {
  return <button type="button" onClick={onClick} className={`studio-dark-action shrink-0 ${primary ? "studio-dark-action--primary" : ""}`}><Icon size={17} />{label}</button>;
}
function Tab({ icon: Icon, label, active, onClick }: { icon: typeof Film; label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-11 min-w-fit items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${active ? "bg-white text-[#0b0e15]" : "text-white/48 hover:bg-white/[0.06] hover:text-white"}`}><Icon size={17} />{label}</button>;
}
