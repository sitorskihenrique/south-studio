"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eraser, FilePlus2, LayoutList, PencilLine, Save, SaveAll } from "lucide-react";
import { calculateBudget, formatCurrency, sectionKeys } from "@/lib/budget/calculations";
import { createDefaultBudget, sectionMeta } from "@/lib/budget/defaults";
import {
  createSavedBudget,
  draftStorageKey,
  readLocalStorage,
  savedBudgetsStorageKey,
  upsertSavedBudget,
  writeLocalStorage,
} from "@/lib/budget/storage";
import { deleteCloudItem, readCloudItems, upsertCloudItem } from "@/lib/supabase/data";
import type { BudgetSectionKey, BudgetState, BudgetStatus, SavedBudget, SimpleBudgetData } from "@/lib/budget/types";
import { BudgetSection, Field, NumberInput, SelectInput, TextArea, TextInput } from "./BudgetFields";
import { BudgetSummary } from "./BudgetSummary";
import { DrePanel, FinancialFlow, ProvisionAndPayment } from "./FinancialPanels";
import { LineItemTable } from "./LineItemTable";
import { budgetStatuses, SavedBudgetsView } from "./SavedBudgetsView";
import { ProjectLinkField } from "@/components/projects/ProjectLinkField";
import { normalizeProjects, projectsStorageKey } from "@/lib/projects/storage";
import type { StudioProject } from "@/lib/projects/types";
import { ToolHeader } from "@/components/ui/ToolHeader";
import { PremiumPreviewDialog } from "@/components/PremiumPreviewDialog";
import { trackUsageEvent } from "@/lib/analytics/usage";

export function BudgetCalculator() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project") || "";
  const [budget, setBudget] = useState<BudgetState>(() => createDefaultBudget());
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "saved">("create");
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Rascunho salvo localmente");
  const [storageLabel, setStorageLabel] = useState("Modo local");
  const [mode, setMode] = useState<"essential" | "professional">("essential");
  const [premiumPreview, setPremiumPreview] = useState(false);
  const totals = useMemo(() => calculateBudget(budget), [budget]);
  const budgetRef = useRef(budget);
  const savedBudgetsRef = useRef(savedBudgets);
  const dirtyRef = useRef(dirty);
  const readyRef = useRef(ready);

  useEffect(() => { budgetRef.current = budget; }, [budget]);
  useEffect(() => { savedBudgetsRef.current = savedBudgets; }, [savedBudgets]);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  useEffect(() => { readyRef.current = ready; }, [ready]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const localSaved = readLocalStorage<SavedBudget[]>(savedBudgetsStorageKey, []);
      const [budgetResult, projectResult] = await Promise.all([
        readCloudItems<SavedBudget>("budgets"),
        initialProjectId ? readCloudItems<StudioProject>("projects") : Promise.resolve(null),
      ]);
      if (!mounted) return;

      const saved = budgetResult?.authenticated && budgetResult.ok ? budgetResult.items : localSaved;
      setSavedBudgets(saved);
      if (budgetResult?.authenticated && budgetResult.ok) writeLocalStorage(savedBudgetsStorageKey, saved);
      setStorageLabel(budgetResult?.authenticated ? (budgetResult.ok ? "Sincronizado na conta" : "Salvo neste dispositivo") : "Modo local");

      if (initialProjectId) {
        const linked = saved.find((item) => linkedProjectId(item) === initialProjectId);
        if (linked) {
          setBudget(normalizeBudget({ ...linked.budget, projectId: initialProjectId }));
          setSaveStatus("Orçamento vinculado ao projeto");
        } else {
          const localProjects = normalizeProjects(readLocalStorage<StudioProject[]>(projectsStorageKey, []));
          const projects = projectResult?.authenticated && projectResult.ok ? projectResult.items : localProjects;
          const project = projects.find((item) => item.id === initialProjectId);
          setBudget(createProjectBudget(initialProjectId, project));
          setSaveStatus("Novo orçamento vinculado ao projeto");
        }
      } else {
        const draft = readLocalStorage<Partial<BudgetState> | null>(draftStorageKey, null);
        setBudget(draft ? normalizeBudget(draft) : createDefaultBudget());
      }

      setDirty(false);
      setReady(true);
    }

    initialize();
    return () => { mounted = false; };
  }, [initialProjectId]);

  useEffect(() => {
    if (!ready) return;
    const refresh = () => {
      readCloudItems<SavedBudget>("budgets", { force: true }).then((result) => {
        if (!result.authenticated || !result.ok) return;
        setSavedBudgets(result.items);
        writeLocalStorage(savedBudgetsStorageKey, result.items);
        if (!dirtyRef.current) {
          const active = result.items.find((item) => item.id === budgetRef.current.id);
          if (active) setBudget(normalizeBudget(active.budget));
        }
      });
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    if (initialProjectId) return;
    const timeout = window.setTimeout(() => {
      writeLocalStorage(draftStorageKey, { ...budget, updatedAt: new Date().toISOString() });
      if (dirty) setSaveStatus("Alterações preservadas como rascunho");
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [budget, dirty, initialProjectId, ready]);

  useEffect(() => {
    if (!ready || !initialProjectId || !dirty) return;

    const timeout = window.setTimeout(() => {
      void persistProjectBudget(budget, savedBudgets, {
        onLocalSave: (next, saved) => {
          setSavedBudgets(next);
          setBudget(saved.budget);
          setDirty(false);
          setSaveStatus("Orçamento salvo automaticamente");
        },
        onCloudSave: (cloud) => {
          if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
        },
      });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [budget, dirty, initialProjectId, ready, savedBudgets]);

  useEffect(() => {
    return () => {
      if (!initialProjectId || !readyRef.current || !dirtyRef.current) return;
      const current = { ...budgetRef.current, projectId: initialProjectId };
      const saved = createSavedBudget(current, calculateBudget(current));
      const next = upsertSavedBudget(savedBudgetsRef.current, saved);
      writeLocalStorage(savedBudgetsStorageKey, next);
      void upsertCloudItem("budgets", saved, saved.projectName);
    };
  }, [initialProjectId]);

  function updateBudget(updater: (current: BudgetState) => BudgetState) {
    setSaveStatus("Alterações não salvas no registro");
    setDirty(true);
    setBudget((current) => {
      const next = updater(current);
      return initialProjectId ? { ...next, projectId: initialProjectId } : next;
    });
  }

  function updateSection(key: BudgetSectionKey, lines: BudgetState["sections"][BudgetSectionKey]) {
    updateBudget((current) => ({
      ...current,
      sections: { ...current.sections, [key]: lines },
    }));
  }

  function updateSetting(key: keyof BudgetState["settings"], value: number) {
    updateBudget((current) => ({
      ...current,
      settings: { ...current.settings, [key]: value },
    }));
  }

  function newBudget() {
    if (dirty && !window.confirm("Você tem alterações não salvas. Deseja continuar?")) return;
    const blank = createDefaultBudget(initialProjectId ? projectBudgetId(initialProjectId) : crypto.randomUUID());
    setBudget({
      ...blank,
      projectId: initialProjectId,
      projectName: initialProjectId ? budget.projectName : blank.projectName,
      client: initialProjectId ? { ...blank.client, company: budget.client.company } : blank.client,
    });
    setDirty(false);
    setSaveStatus("Novo orçamento iniciado");
    setActiveTab("create");
  }

  function clearCalculation() {
    updateBudget((current) => ({
      ...current,
      sections: Object.fromEntries(
        Object.entries(current.sections).map(([key, lines]) => [
          key,
          lines.map((line) => ({ ...line, unitValue: 0, quantity: 0 })),
        ]),
      ) as BudgetState["sections"],
    }));
  }

  async function saveNow() {
    const saved = createSavedBudget(budget, totals);
    const next = upsertSavedBudget(savedBudgets, saved);
    setSavedBudgets(next);
    setBudget(saved.budget);
    const cloud = await upsertCloudItem("budgets", saved, saved.projectName);
    writeLocalStorage(savedBudgetsStorageKey, next);
    writeLocalStorage(draftStorageKey, saved.budget);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
    setDirty(false);
    setSaveStatus(cloud.authenticated && cloud.ok ? "Orçamento salvo na sua conta." : "Orçamento salvo localmente.");
    if (cloud.authenticated && (cloud.ok || cloud.queued)) void trackUsageEvent("budget_saved", "budgets");
  }

  async function saveAsNew(source = budget) {
    const copy = normalizeBudget({
      ...source,
      id: crypto.randomUUID(),
      projectName: `Cópia de ${source.projectName || "orçamento"}`,
      status: "Rascunho",
      createdAt: "",
      updatedAt: "",
    });
    const saved = createSavedBudget(copy, calculateBudget(copy));
    const next = upsertSavedBudget(savedBudgets, saved);
    setSavedBudgets(next);
    setBudget(saved.budget);
    const cloud = await upsertCloudItem("budgets", saved, saved.projectName);
    writeLocalStorage(savedBudgetsStorageKey, next);
    writeLocalStorage(draftStorageKey, saved.budget);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
    setDirty(false);
    setSaveStatus(cloud.authenticated && cloud.ok ? "Orçamento salvo como novo na sua conta." : "Orçamento salvo como novo localmente.");
    setActiveTab("create");
  }

  function openSaved(item: SavedBudget) {
    setBudget(normalizeBudget(item.budget));
    setDirty(false);
    setSaveStatus("Editando orçamento salvo");
    setActiveTab("create");
  }

  async function deleteSaved(item: SavedBudget) {
    if (!window.confirm("Tem certeza que deseja excluir este orçamento?")) return;
    const next = savedBudgets.filter((budgetItem) => budgetItem.id !== item.id);
    setSavedBudgets(next);
    const cloud = await deleteCloudItem("budgets", item.id);
    writeLocalStorage(savedBudgetsStorageKey, next);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
  }

  async function changeSavedStatus(item: SavedBudget, status: BudgetStatus) {
    const updatedBudget = { ...item.budget, status, updatedAt: new Date().toISOString() };
    const updated = createSavedBudget(updatedBudget, calculateBudget(updatedBudget));
    const next = upsertSavedBudget(savedBudgets, updated);
    setSavedBudgets(next);
    const cloud = await upsertCloudItem("budgets", updated, updated.projectName);
    writeLocalStorage(savedBudgetsStorageKey, next);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
    if (budget.id === item.id) setBudget(updated.budget);
  }

  const isSaved = savedBudgets.some((item) => item.id === budget.id);

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1340px] px-4 py-5 sm:px-8 lg:px-10 lg:py-9 fade-in">
        <ToolHeader
          eyebrow="Financeiro"
          title="Orçamentos"
          description="Precifique com clareza, margem e prazo, sem transformar o processo em uma planilha."
          actions={activeTab === "create" ? (
            <>
                <ActionButton icon={FilePlus2} label="Novo orçamento" onClick={newBudget} />
                <ActionButton icon={Save} label="Salvar orçamento" onClick={saveNow} primary />
                {!initialProjectId && <ActionButton icon={SaveAll} label="Salvar como novo" onClick={() => saveAsNew()} />}
                <ActionButton icon={Eraser} label="Limpar cálculo" onClick={clearCalculation} />
            </>
          ) : undefined}
        >
          <div className="hide-scrollbar mt-7 flex w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.06] p-1 sm:w-fit">
            <TabButton
              active={activeTab === "create"}
              icon={PencilLine}
              label="Criar orçamento"
              onClick={() => setActiveTab("create")}
            />
            <TabButton
              active={activeTab === "saved"}
              icon={LayoutList}
              label={`Meus orçamentos (${savedBudgets.length})`}
              onClick={() => setActiveTab("saved")}
            />
          </div>
          {activeTab === "create" && <div className="hide-scrollbar mt-3 flex w-full gap-1 overflow-x-auto rounded-2xl bg-white/[0.06] p-1 sm:w-fit"><ModeButton active={mode === "essential"} label="Essencial" onClick={() => setMode("essential")} /><ModeButton active={false} label="Profissional" premium onClick={() => setPremiumPreview(true)} /></div>}
        </ToolHeader>

        {activeTab === "saved" ? (
          <SavedBudgetsView
            budgets={savedBudgets}
            onOpen={openSaved}
            onDuplicate={(item) => saveAsNew(item.budget)}
            onDelete={deleteSaved}
            onStatusChange={changeSavedStatus}
          />
        ) : (
          <>
            <EditingHeader
              budget={budget}
              isSaved={isSaved}
              saveStatus={saveStatus}
              storageLabel={storageLabel}
              updateBudget={updateBudget}
            />
            {mode === "essential" ? <EssentialBudget budget={budget} totals={totals} updateBudget={updateBudget} updateSetting={updateSetting} /> : <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <main className="order-2 space-y-5 xl:order-1">
                <ClientCard budget={budget} updateBudget={updateBudget} />
                <BriefingCard budget={budget} updateBudget={updateBudget} />

                {sectionKeys.map((key) => {
                  const meta = sectionMeta[key as keyof typeof sectionMeta];
                  const sectionTotal = totals.sections[key as keyof typeof totals.sections];
                  const sectionItems = budget.sections[key as keyof typeof budget.sections];
                  return (
                    <BudgetSection
                      key={key}
                      eyebrow={meta.eyebrow}
                      title={meta.title}
                      description={meta.description}
                      total={formatCurrency(sectionTotal)}
                    >
                      <LineItemTable
                        items={sectionItems}
                        usesComplexity={meta.usesComplexity}
                        quantityLabel={meta.quantityLabel}
                        onChange={(lines) => updateSection(key, lines)}
                      />
                    </BudgetSection>
                  );
                })}

                <FinancialFlow budget={budget} totals={totals} updateSetting={updateSetting} />
                <ProvisionAndPayment budget={budget} totals={totals} updateSetting={updateSetting} />
                <DrePanel budget={budget} totals={totals} />

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white p-4">
                  <p className="text-xs text-zinc-500">
                    ID do orçamento:{" "}
                    <span className="font-semibold text-zinc-700">{budget.id.slice(0, 8)}</span>
                  </p>
                  <p className="text-xs text-zinc-400">{storageLabel}</p>
                </div>
              </main>
              <BudgetSummary budget={budget} totals={totals} />
            </div>}
          </>
        )}
      </div>
      <PremiumPreviewDialog
        open={premiumPreview}
        title="Orçamento Profissional"
        description="Custos avançados, DRE, provisionamento e análises detalhadas estarão disponíveis na experiência Premium."
        onClose={() => setPremiumPreview(false)}
      />
    </section>
  );
}

function EssentialBudget({ budget, updateBudget, updateSetting }: { budget: BudgetState; totals: ReturnType<typeof calculateBudget>; updateBudget: (updater: (current: BudgetState) => BudgetState) => void; updateSetting: (key: keyof BudgetState["settings"], value: number) => void }) {
  const simple = budget.simple;
  const preProduction = simple.preProductionHours * simple.preProductionHourlyRate;
  const filming = simple.filmingHours * simple.filmingHourlyRate;
  const editing = simple.editingHours * simple.editingHourlyRate;
  const finishing = simple.finishingHours * simple.finishingHourlyRate;
  const totalHours = simple.preProductionHours + simple.filmingHours + simple.editingHours + simple.finishingHours;
  const hourlyCost = ["Por hora", "Misto"].includes(simple.chargeType) ? preProduction + filming + editing + finishing : 0;
  const dailyCost = ["Por diária", "Misto"].includes(simple.chargeType) ? simple.dayCount * simple.dayRate : 0;
  const base = hourlyCost + dailyCost + simple.equipment + simple.travel + simple.food + simple.otherCosts;
  const profit = base * (budget.settings.profitPercent / 100);
  const suggested = (base + profit) * (1 + budget.settings.taxPercent / 100);

  function changeSimple(patch: Partial<SimpleBudgetData>) {
    updateBudget((current) => {
      const next = { ...current.simple, ...patch };
      const usesHours = ["Por hora", "Misto"].includes(next.chargeType);
      const usesDays = ["Por diária", "Misto"].includes(next.chargeType);
      const setFirst = (section: BudgetSectionKey, value: number) => current.sections[section].map((line, index) => index === 0 ? { ...line, unitValue: value, quantity: value ? 1 : 0 } : line);
      return {
        ...current,
        simple: next,
        sections: {
          ...current.sections,
          preProduction: setFirst("preProduction", usesHours ? next.preProductionHours * next.preProductionHourlyRate : 0),
          southProduction: setFirst("southProduction", (usesHours ? next.filmingHours * next.filmingHourlyRate : 0) + (usesDays ? next.dayCount * next.dayRate : 0)),
          postProduction: setFirst("postProduction", usesHours ? (next.editingHours * next.editingHourlyRate) + (next.finishingHours * next.finishingHourlyRate) : 0),
          equipment: setFirst("equipment", next.equipment),
          travelCosts: setFirst("travelCosts", next.travel),
          teamCosts: setFirst("teamCosts", next.food),
          freelanceProduction: setFirst("freelanceProduction", next.otherCosts),
        },
      };
    });
  }

  const usesHours = ["Por hora", "Misto"].includes(simple.chargeType);

  return (
    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="space-y-5">
        <section className="studio-card rounded-[28px] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase text-zinc-400">Orçamento essencial</p>
          <h2 className="mt-3 text-2xl font-semibold">Descubra quanto cobrar por cada etapa.</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nome do projeto"><TextInput value={budget.projectName} onChange={(event) => updateBudget((current) => ({ ...current, projectName: event.target.value }))} /></Field>
            <Field label="Cliente"><TextInput value={budget.client.company} onChange={(event) => updateBudget((current) => ({ ...current, client: { ...current.client, company: event.target.value } }))} /></Field>
            <div className="sm:col-span-2"><ProjectLinkField value={budget.projectId} onChange={(projectId) => updateBudget((current) => ({ ...current, projectId }))} /></div>
            <div className="sm:col-span-2"><Field label="Tipo de cobrança"><SelectInput value={simple.chargeType} onChange={(event) => changeSimple({ chargeType: event.target.value as SimpleBudgetData["chargeType"] })}><option>Por diária</option><option>Por hora</option><option>Misto</option></SelectInput></Field></div>
          </div>

          {usesHours && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <WorkRateCard title="Gravação" hours={simple.filmingHours} rate={simple.filmingHourlyRate} total={filming} onHours={(value) => changeSimple({ filmingHours: value })} onRate={(value) => changeSimple({ filmingHourlyRate: value })} />
              <WorkRateCard title="Edição" hours={simple.editingHours} rate={simple.editingHourlyRate} total={editing} onHours={(value) => changeSimple({ editingHours: value })} onRate={(value) => changeSimple({ editingHourlyRate: value })} />
              <WorkRateCard title="Pré-produção" hours={simple.preProductionHours} rate={simple.preProductionHourlyRate} total={preProduction} onHours={(value) => changeSimple({ preProductionHours: value })} onRate={(value) => changeSimple({ preProductionHourlyRate: value })} />
              <WorkRateCard title="Finalização" hours={simple.finishingHours} rate={simple.finishingHourlyRate} total={finishing} onHours={(value) => changeSimple({ finishingHours: value })} onRate={(value) => changeSimple({ finishingHourlyRate: value })} />
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {["Por diária", "Misto"].includes(simple.chargeType) && <>
              <Field label="Quantidade de diárias"><NumberInput value={simple.dayCount} onValueChange={(value) => changeSimple({ dayCount: value })} /></Field>
              <Field label="Valor por diária"><NumberInput value={simple.dayRate} suffix="R$" onValueChange={(value) => changeSimple({ dayRate: value })} /></Field>
            </>}
            <Field label="Equipamentos"><NumberInput value={simple.equipment} suffix="R$" onValueChange={(value) => changeSimple({ equipment: value })} /></Field>
            <Field label="Deslocamento"><NumberInput value={simple.travel} suffix="R$" onValueChange={(value) => changeSimple({ travel: value })} /></Field>
            <Field label="Alimentação"><NumberInput value={simple.food} suffix="R$" onValueChange={(value) => changeSimple({ food: value })} /></Field>
            <Field label="Outros custos"><NumberInput value={simple.otherCosts} suffix="R$" onValueChange={(value) => changeSimple({ otherCosts: value })} /></Field>
            <Field label="Margem %"><NumberInput value={budget.settings.profitPercent} onValueChange={(value) => updateSetting("profitPercent", value)} /></Field>
            <Field label="Imposto %"><NumberInput value={budget.settings.taxPercent} onValueChange={(value) => updateSetting("taxPercent", value)} /></Field>
          </div>
        </section>
      </main>

      <aside className="studio-card rounded-[28px] p-5 sm:p-6 xl:sticky xl:top-5">
        <p className="text-xs font-semibold uppercase text-zinc-400">Sugestão de cobrança</p>
        <p className="mt-4 text-4xl font-semibold text-zinc-950">{formatCurrency(suggested)}</p>
        <div className="mt-6 space-y-3 text-sm">
          {usesHours && <>
            <SimpleResult label="Gravação" value={formatCurrency(filming)} />
            <SimpleResult label="Edição" value={formatCurrency(editing)} />
            <SimpleResult label="Pré-produção" value={formatCurrency(preProduction)} />
            <SimpleResult label="Finalização" value={formatCurrency(finishing)} />
            <SimpleResult label="Total das etapas" value={formatCurrency(hourlyCost)} />
          </>}
          <SimpleResult label="Custo base" value={formatCurrency(base)} />
          <SimpleResult label="Total de horas" value={`${totalHours}h`} />
          <SimpleResult label="Lucro estimado" value={formatCurrency(profit)} />
        </div>
        <p className="mt-6 text-xs leading-5 text-zinc-500">Use esta sugestão como ponto de partida e ajuste conforme escopo, experiência e valor percebido.</p>
      </aside>
    </div>
  );
}

function WorkRateCard({ title, hours, rate, total, onHours, onRate }: { title: string; hours: number; rate: number; total: number; onHours: (value: number) => void; onRate: (value: number) => void }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-zinc-900">{title}</h3>
        <span className="text-sm font-semibold text-zinc-500">{formatCurrency(total)}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Quantidade de horas"><NumberInput value={hours} onValueChange={onHours} /></Field>
        <Field label="Valor por hora"><NumberInput value={rate} suffix="R$" onValueChange={onRate} /></Field>
      </div>
    </section>
  );
}

function SimpleResult({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3"><span className="text-zinc-500">{label}</span><strong className="text-right text-zinc-900">{value}</strong></div>;
}

function ModeButton({ active, label, premium = false, onClick }: { active: boolean; label: string; premium?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-transparent px-4 text-xs font-semibold transition ${premium ? "studio-premium" : active ? "bg-white text-[#0b0e15] shadow-sm" : "text-white/48"}`}>{label}{premium && <span className="studio-premium-badge rounded-full px-2 py-0.5 text-[9px] font-bold uppercase">Premium</span>}</button>;
}

function EditingHeader({
  budget,
  isSaved,
  saveStatus,
  storageLabel,
  updateBudget,
}: {
  budget: BudgetState;
  isSaved: boolean;
  saveStatus: string;
  storageLabel: string;
  updateBudget: (updater: (current: BudgetState) => BudgetState) => void;
}) {
  return (
    <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_190px] sm:items-end">
      <div className="sm:col-span-2"><ProjectLinkField value={budget.projectId} onChange={(projectId, project) => updateBudget((current) => ({ ...current, projectId, projectName: project && (!current.projectName || current.projectName === "Orçamento exemplo") ? project.title : current.projectName, client: project && !current.client.company ? { ...current.client, company: project.client } : current.client }))} /></div>
      <Field label={isSaved ? "Editando orçamento salvo" : "Nome do projeto"}>
        <TextInput
          value={budget.projectName}
          onChange={(event) =>
            updateBudget((current) => ({ ...current, projectName: event.target.value }))
          }
        />
      </Field>
      <Field label="Status atual">
        <SelectInput
          value={budget.status}
          onChange={(event) =>
            updateBudget((current) => ({
              ...current,
              status: event.target.value as BudgetStatus,
            }))
          }
        >
          {budgetStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </SelectInput>
      </Field>
      <div className="sm:col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
        <span>{saveStatus}</span>
        <span>{storageLabel}</span>
        {budget.createdAt && <span>Criado em {formatDate(budget.createdAt)}</span>}
        {budget.updatedAt && <span>Última alteração {formatDate(budget.updatedAt)}</span>}
      </div>
    </div>
  );
}

function projectBudgetId(projectId: string) {
  return `project-budget-${projectId}`;
}

function linkedProjectId(item: SavedBudget) {
  return item.projectId || item.budget?.projectId || "";
}

function createProjectBudget(projectId: string, project?: StudioProject) {
  const budget = createDefaultBudget(projectBudgetId(projectId));
  return {
    ...budget,
    projectId,
    projectName: project?.title || "",
    client: { ...budget.client, company: project?.client || "" },
    briefing: { ...budget.briefing, productionDays: 0 },
    simple: {
      ...budget.simple,
      preProductionHours: 0,
      filmingHours: 0,
      editingHours: 0,
      hourlyRate: 0,
      dayCount: 0,
      dayRate: 0,
      equipment: 0,
      travel: 0,
      food: 0,
      otherCosts: 0,
    },
  };
}

async function persistProjectBudget(
  budget: BudgetState,
  currentSaved: SavedBudget[],
  callbacks: {
    onLocalSave: (next: SavedBudget[], saved: SavedBudget) => void;
    onCloudSave: (result: { authenticated: boolean; ok: boolean; error?: string }) => void;
  },
) {
  const saved = createSavedBudget(budget, calculateBudget(budget));
  const next = upsertSavedBudget(currentSaved, saved);
  const cloud = await upsertCloudItem("budgets", saved, saved.projectName);
  writeLocalStorage(savedBudgetsStorageKey, next);
  callbacks.onLocalSave(next, saved);
  callbacks.onCloudSave(cloud);
}

function normalizeBudget(stored: Partial<BudgetState>): BudgetState {
  const defaults = createDefaultBudget(stored.id || crypto.randomUUID());
  const legacyHourlyRate = safeNumber(stored.simple?.hourlyRate);
  return {
    ...defaults,
    ...stored,
    client: { ...defaults.client, ...stored.client },
    briefing: { ...defaults.briefing, ...stored.briefing },
    sections: { ...defaults.sections, ...stored.sections },
    settings: { ...defaults.settings, ...stored.settings },
    simple: {
      ...defaults.simple,
      ...stored.simple,
      preProductionHourlyRate: safeNumber(stored.simple?.preProductionHourlyRate, legacyHourlyRate),
      filmingHourlyRate: safeNumber(stored.simple?.filmingHourlyRate, legacyHourlyRate),
      editingHourlyRate: safeNumber(stored.simple?.editingHourlyRate, legacyHourlyRate),
      finishingHours: safeNumber(stored.simple?.finishingHours),
      finishingHourlyRate: safeNumber(stored.simple?.finishingHourlyRate, legacyHourlyRate),
    },
  };
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function ClientCard({
  budget,
  updateBudget,
}: {
  budget: BudgetState;
  updateBudget: (updater: (current: BudgetState) => BudgetState) => void;
}) {
  const fields: { key: keyof BudgetState["client"]; label: string; type?: string }[] = [
    { key: "company", label: "Empresa ou agência" },
    { key: "document", label: "CNPJ" },
    { key: "responsible", label: "Responsável" },
    { key: "email", label: "E-mail", type: "email" },
    { key: "contact", label: "Contato" },
  ];
  return (
    <BudgetSection eyebrow="Seção 01" title="Dados do Cliente" description="Informações comerciais da proposta.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <Field key={field.key} label={field.label}>
            <TextInput
              type={field.type}
              value={budget.client[field.key] as string}
              onChange={(event) =>
                updateBudget((current) => ({
                  ...current,
                  client: { ...current.client, [field.key]: event.target.value },
                }))
              }
            />
          </Field>
        ))}
        <Field label="Budget do cliente" hint="Opcional">
          <NumberInput
            value={budget.client.budget}
            step="100"
            suffix="R$"
            onValueChange={(value) =>
              updateBudget((current) => ({ ...current, client: { ...current.client, budget: value } }))
            }
          />
        </Field>
      </div>
    </BudgetSection>
  );
}

function BriefingCard({
  budget,
  updateBudget,
}: {
  budget: BudgetState;
  updateBudget: (updater: (current: BudgetState) => BudgetState) => void;
}) {
  function updateBriefing(key: keyof BudgetState["briefing"], value: string | number) {
    updateBudget((current) => ({
      ...current,
      briefing: { ...current.briefing, [key]: value },
    }));
  }
  return (
    <BudgetSection eyebrow="Seção 02" title="Briefing Rápido" description="Contexto, datas e escopo da entrega.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Local"><TextInput value={budget.briefing.location} onChange={(event) => updateBriefing("location", event.target.value)} /></Field>
        <Field label="Data do orçamento"><TextInput type="date" value={budget.briefing.budgetDate} onChange={(event) => updateBriefing("budgetDate", event.target.value)} /></Field>
        <Field label="Quantidade de diárias"><NumberInput value={budget.briefing.productionDays} step="1" onValueChange={(value) => updateBriefing("productionDays", value)} /></Field>
        <Field label="Data da diária"><TextInput type="date" value={budget.briefing.productionDate} onChange={(event) => updateBriefing("productionDate", event.target.value)} /></Field>
        <Field label="Data da entrega"><TextInput type="date" value={budget.briefing.deliveryDate} onChange={(event) => updateBriefing("deliveryDate", event.target.value)} /></Field>
        <Field label="Previsão de pagamento"><TextInput value={budget.briefing.paymentForecast} onChange={(event) => updateBriefing("paymentForecast", event.target.value)} /></Field>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Field label="Logline do projeto"><TextArea value={budget.briefing.logline} onChange={(event) => updateBriefing("logline", event.target.value)} /></Field>
        <Field label="Descrição / entregáveis"><TextArea value={budget.briefing.deliverables} onChange={(event) => updateBriefing("deliverables", event.target.value)} /></Field>
        <Field label="Responsáveis"><TextArea value={budget.briefing.responsibles} onChange={(event) => updateBriefing("responsibles", event.target.value)} /></Field>
      </div>
    </BudgetSection>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  primary = false,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`studio-dark-action shrink-0 ${primary ? "studio-dark-action--primary" : ""}`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
        active ? "bg-white text-[#0b0e15]" : "text-white/48 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
