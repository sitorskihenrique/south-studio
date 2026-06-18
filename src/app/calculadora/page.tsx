import { AppShell } from "@/components/AppShell";
import { LoadingPanel } from "@/components/LoadingPanel";
import { FeaturePreviewLock } from "@/components/FeaturePreviewLock";
import dynamic from "next/dynamic";

const BudgetCalculator = dynamic(
  () => import("@/components/budget/BudgetCalculator").then((mod) => mod.BudgetCalculator),
  { loading: () => <LoadingPanel label="Carregando calculadora..." /> },
);

export default function BudgetCalculatorPage() {
  return (
    <AppShell>
      <FeaturePreviewLock
        title="Orçamentos estão quase prontos."
        description="Uma experiência mais inteligente para precificar produções, organizar custos e proteger sua margem está chegando."
      >
        <BudgetCalculator />
      </FeaturePreviewLock>
    </AppShell>
  );
}
