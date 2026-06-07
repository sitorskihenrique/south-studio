"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { BudgetSectionKey, BudgetState, BudgetStatus, SavedBudget } from "@/lib/budget/types";
import { BudgetSection, Field, NumberInput, SelectInput, TextArea, TextInput } from "./BudgetFields";
import { BudgetSummary } from "./BudgetSummary";
import { DrePanel, FinancialFlow, ProvisionAndPayment } from "./FinancialPanels";
import { LineItemTable } from "./LineItemTable";
import { budgetStatuses, SavedBudgetsView } from "./SavedBudgetsView";

export function BudgetCalculator() {
  const [budget, setBudget] = useState<BudgetState>(() => createDefaultBudget());
  const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "saved">("create");
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Rascunho salvo localmente");
  const totals = useMemo(() => calculateBudget(budget), [budget]);

  useEffect(() => {
    const draft = readLocalStorage<Partial<BudgetState> | null>(draftStorageKey, null);
    const saved = readLocalStorage<SavedBudget[]>(savedBudgetsStorageKey, []);
    if (draft) setBudget(normalizeBudget(draft));
    setSavedBudgets(saved);
    setReady(true);
  }, []);

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
    setBudget(createDefaultBudget(crypto.randomUUID()));
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

  function saveNow() {
    const saved = createSavedBudget(budget, totals);
    const next = upsertSavedBudget(savedBudgets, saved);
    setSavedBudgets(next);
    setBudget(saved.budget);
    writeLocalStorage(savedBudgetsStorageKey, next);
    writeLocalStorage(draftStorageKey, saved.budget);
    setDirty(false);
    setSaveStatus("Orçamento salvo com sucesso.");
  }

  function saveAsNew(source = budget) {
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
    setDirty(false);
    setSaveStatus("Orçamento salvo como novo.");
    setActiveTab("create");
  }

  function openSaved(item: SavedBudget) {
    setBudget(normalizeBudget(item.budget));
    setDirty(false);
    setSaveStatus("Editando orçamento salvo");
    setActiveTab("create");
  }

  function deleteSaved(item: SavedBudget) {
    if (!window.confirm("Tem certeza que deseja excluir este orçamento?")) return;
    const next = savedBudgets.filter((budgetItem) => budgetItem.id !== item.id);
    setSavedBudgets(next);
    writeLocalStorage(savedBudgetsStorageKey, next);
  }

  function changeSavedStatus(item: SavedBudget, status: BudgetStatus) {
    const updatedBudget = { ...item.budget, status, updatedAt: new Date().toISOString() };
    const updated = createSavedBudget(updatedBudget, calculateBudget(updatedBudget));
    const next = upsertSavedBudget(savedBudgets, updated);
    setSavedBudgets(next);
    writeLocalStorage(savedBudgetsStorageKey, next);
    if (budget.id === item.id) setBudget(updated.budget);
  }

  const isSaved = savedBudgets.some((item) => item.id === budget.id);

  return (
    <section className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1340px] px-3 py-5 sm:px-7 lg:px-8 lg:py-8">
        <header className="mb-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                <Sparkles size={14} />
                Gestão de orçamentos audiovisual
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Calculadora de Orçamento
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                Crie, salve e acompanhe propostas com custo, margem, impostos e lucro.
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
              updateBudget={updateBudget}
            />
            <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                  <p className="text-xs text-zinc-400">Dados armazenados somente neste navegador.</p>
                </div>
              </main>
              <BudgetSummary budget={budget} totals={totals} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function EditingHeader({
  budget,
  isSaved,
  saveStatus,
  updateBudget,
}: {
  budget: BudgetState;
  isSaved: boolean;
  saveStatus: string;
  updateBudget: (updater: (current: BudgetState) => BudgetState) => void;
}) {
  return (
    <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_190px] sm:items-end">
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
