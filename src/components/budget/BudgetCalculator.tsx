"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eraser, FilePlus2, LayoutList, PencilLine, Save, SaveAll, Sparkles } from "lucide-react";
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
  const totals = useMemo(() => calculateBudget(budget), [budget]);

  useEffect(() => {
    let mounted = true;
    const draft = readLocalStorage<Partial<BudgetState> | null>(draftStorageKey, null);
    const saved = readLocalStorage<SavedBudget[]>(savedBudgetsStorageKey, []);
    if (draft) setBudget(normalizeBudget({ ...draft, projectId: initialProjectId || draft.projectId }));
    else if (initialProjectId) setBudget((current) => ({ ...current, projectId: initialProjectId }));
    setSavedBudgets(saved);
    setReady(true);
    readCloudItems<SavedBudget>("budgets").then((result) => {
      if (!mounted) return;
      if (!result.authenticated) {
        setStorageLabel("Modo local");
        return;
      }
      setStorageLabel(result.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
      if (result.ok && result.items.length) setSavedBudgets(result.items);
    });
    return () => { mounted = false; };
  }, [initialProjectId]);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => {
      writeLocalStorage(draftStorageKey, { ...budget, updatedAt: new Date().toISOString() });
      if (dirty) setSaveStatus("Alterações preservadas como rascunho");
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [budget, dirty, ready]);

  function updateBudget(updater: (current: BudgetState) => BudgetState) {
    setSaveStatus("Alterações não salvas no registro");
    setDirty(true);
    setBudget(updater);
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
    setBudget({ ...createDefaultBudget(crypto.randomUUID()), projectId: initialProjectId });
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
    writeLocalStorage(savedBudgetsStorageKey, next);
    writeLocalStorage(draftStorageKey, saved.budget);
    const cloud = await upsertCloudItem("budgets", saved, saved.projectName);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
    setDirty(false);
    setSaveStatus(cloud.authenticated && cloud.ok ? "Orçamento salvo na sua conta." : "Orçamento salvo localmente.");
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
    writeLocalStorage(savedBudgetsStorageKey, next);
    writeLocalStorage(draftStorageKey, saved.budget);
    const cloud = await upsertCloudItem("budgets", saved, saved.projectName);
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
    writeLocalStorage(savedBudgetsStorageKey, next);
    const cloud = await deleteCloudItem("budgets", item.id);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
  }

  async function changeSavedStatus(item: SavedBudget, status: BudgetStatus) {
    const updatedBudget = { ...item.budget, status, updatedAt: new Date().toISOString() };
    const updated = createSavedBudget(updatedBudget, calculateBudget(updatedBudget));
    const next = upsertSavedBudget(savedBudgets, updated);
    setSavedBudgets(next);
    writeLocalStorage(savedBudgetsStorageKey, next);
    const cloud = await upsertCloudItem("budgets", updated, updated.projectName);
    if (cloud.authenticated) setStorageLabel(cloud.ok ? "Sincronizado na conta" : "Salvo neste dispositivo");
    if (budget.id === item.id) setBudget(updated.budget);
  }

  const isSaved = savedBudgets.some((item) => item.id === budget.id);

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1340px] px-4 py-5 sm:px-8 lg:px-10 lg:py-9 fade-in">
        <header className="studio-card mb-6 rounded-[32px] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-500">
                <Sparkles size={14} />
                Clareza financeira
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
                Calculadora de Orçamento
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                Menos planilha. Mais decisão. Precifique com margem, prazo e entrega em foco.
              </p>
            </div>
            {activeTab === "create" && (
              <div className="flex flex-wrap gap-2">
                <ActionButton icon={FilePlus2} label="Novo orçamento" onClick={newBudget} />
                <ActionButton icon={Save} label="Salvar orçamento" onClick={saveNow} primary />
                <ActionButton icon={SaveAll} label="Salvar como novo" onClick={() => saveAsNew()} />
                <ActionButton icon={Eraser} label="Limpar cálculo" onClick={clearCalculation} />
              </div>
            )}
          </div>

          <div className="mt-6 flex w-full gap-1 rounded-2xl border border-zinc-200 bg-white p-1 sm:w-fit">
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
          {activeTab === "create" && <div className="mt-3 flex w-full gap-1 rounded-2xl bg-zinc-100 p-1 sm:w-fit"><ModeButton active={mode === "essential"} label="Essencial" onClick={() => setMode("essential")} /><ModeButton active={mode === "professional"} label="Profissional · Premium em breve" onClick={() => setMode("professional")} /></div>}
        </header>

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
    </section>
  );
}

function EssentialBudget({ budget, updateBudget, updateSetting }: { budget: BudgetState; totals: ReturnType<typeof calculateBudget>; updateBudget: (updater: (current: BudgetState) => BudgetState) => void; updateSetting: (key: keyof BudgetState["settings"], value: number) => void }) {
  const simple = budget.simple;
  const totalHours = simple.preProductionHours + simple.filmingHours + simple.editingHours;
  const hourlyCost = ["Por hora", "Misto"].includes(simple.chargeType) ? totalHours * simple.hourlyRate : 0;
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
          preProduction: setFirst("preProduction", usesHours ? next.preProductionHours * next.hourlyRate : 0),
          southProduction: setFirst("southProduction", (usesHours ? next.filmingHours * next.hourlyRate : 0) + (usesDays ? next.dayCount * next.dayRate : 0)),
          postProduction: setFirst("postProduction", usesHours ? next.editingHours * next.hourlyRate : 0),
          equipment: setFirst("equipment", next.equipment),
          travelCosts: setFirst("travelCosts", next.travel),
          teamCosts: setFirst("teamCosts", next.food),
          freelanceProduction: setFirst("freelanceProduction", next.otherCosts),
        },
      };
    });
  }

  return <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><main className="space-y-5"><section className="studio-card rounded-[28px] p-5 sm:p-7"><p className="text-xs font-semibold uppercase text-zinc-400">Orçamento essencial</p><h2 className="mt-3 text-2xl font-semibold">Descubra quanto cobrar, sem virar uma planilha.</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Nome do projeto"><TextInput value={budget.projectName} onChange={(event) => updateBudget((current) => ({ ...current, projectName: event.target.value }))} /></Field><Field label="Cliente"><TextInput value={budget.client.company} onChange={(event) => updateBudget((current) => ({ ...current, client: { ...current.client, company: event.target.value } }))} /></Field><div className="sm:col-span-2"><ProjectLinkField value={budget.projectId} onChange={(projectId) => updateBudget((current) => ({ ...current, projectId }))} /></div><div className="sm:col-span-2"><Field label="Tipo de cobrança"><SelectInput value={simple.chargeType} onChange={(event) => changeSimple({ chargeType: event.target.value as SimpleBudgetData["chargeType"] })}><option>Por diária</option><option>Por hora</option><option>Misto</option></SelectInput></Field></div>{["Por hora", "Misto"].includes(simple.chargeType) && <><Field label="Horas de pré-produção"><NumberInput value={simple.preProductionHours} onValueChange={(value) => changeSimple({ preProductionHours: value })} /></Field><Field label="Horas de gravação"><NumberInput value={simple.filmingHours} onValueChange={(value) => changeSimple({ filmingHours: value })} /></Field><Field label="Horas de edição"><NumberInput value={simple.editingHours} onValueChange={(value) => changeSimple({ editingHours: value })} /></Field><Field label="Valor por hora"><NumberInput value={simple.hourlyRate} suffix="R$" onValueChange={(value) => changeSimple({ hourlyRate: value })} /></Field></>}{["Por diária", "Misto"].includes(simple.chargeType) && <><Field label="Quantidade de diárias"><NumberInput value={simple.dayCount} onValueChange={(value) => changeSimple({ dayCount: value })} /></Field><Field label="Valor por diária"><NumberInput value={simple.dayRate} suffix="R$" onValueChange={(value) => changeSimple({ dayRate: value })} /></Field></>}<Field label="Equipamentos"><NumberInput value={simple.equipment} suffix="R$" onValueChange={(value) => changeSimple({ equipment: value })} /></Field><Field label="Deslocamento"><NumberInput value={simple.travel} suffix="R$" onValueChange={(value) => changeSimple({ travel: value })} /></Field><Field label="Alimentação"><NumberInput value={simple.food} suffix="R$" onValueChange={(value) => changeSimple({ food: value })} /></Field><Field label="Outros custos"><NumberInput value={simple.otherCosts} suffix="R$" onValueChange={(value) => changeSimple({ otherCosts: value })} /></Field><Field label="Margem %"><NumberInput value={budget.settings.profitPercent} onValueChange={(value) => updateSetting("profitPercent", value)} /></Field><Field label="Imposto %"><NumberInput value={budget.settings.taxPercent} onValueChange={(value) => updateSetting("taxPercent", value)} /></Field></div></section></main><aside className="studio-card rounded-[28px] p-5 sm:p-6 xl:sticky xl:top-5"><p className="text-xs font-semibold uppercase text-zinc-400">Sugestão de cobrança</p><p className="mt-4 text-4xl font-semibold text-zinc-950">{formatCurrency(suggested)}</p><div className="mt-6 space-y-3 text-sm"><SimpleResult label="Custo base" value={formatCurrency(base)} /><SimpleResult label="Total de horas" value={`${totalHours}h`} /><SimpleResult label="Valor por hora aplicado" value={formatCurrency(simple.hourlyRate)} /><SimpleResult label="Lucro estimado" value={formatCurrency(profit)} /></div><p className="mt-6 text-xs leading-5 text-zinc-500">Use esta sugestão como ponto de partida e ajuste conforme escopo, experiência e valor percebido.</p></aside></div>;
}

function SimpleResult({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3"><span className="text-zinc-500">{label}</span><strong className="text-right text-zinc-900">{value}</strong></div>;
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-h-10 rounded-xl px-4 text-xs font-semibold transition ${active ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}>{label}</button>;
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

function normalizeBudget(stored: Partial<BudgetState>): BudgetState {
  const defaults = createDefaultBudget(stored.id || crypto.randomUUID());
  return {
    ...defaults,
    ...stored,
    client: { ...defaults.client, ...stored.client },
    briefing: { ...defaults.briefing, ...stored.briefing },
    sections: { ...defaults.sections, ...stored.sections },
    settings: { ...defaults.settings, ...stored.settings },
    simple: { ...defaults.simple, ...stored.simple },
  };
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
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
        primary
          ? "bg-zinc-950 text-white shadow-lg shadow-zinc-950/15 hover:bg-zinc-800"
          : "border border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 hover:text-violet-700"
      }`}
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
      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition sm:flex-none ${
        active ? "bg-zinc-950 text-white" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
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
