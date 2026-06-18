import { AppShell } from "@/components/AppShell";
import { LoadingPanel } from "@/components/LoadingPanel";
import dynamic from "next/dynamic";

const BudgetCalculator = dynamic(
  () => import("@/components/budget/BudgetCalculator").then((mod) => mod.BudgetCalculator),
  { loading: () => <LoadingPanel label="Carregando calculadora..." /> },
);

export default function BudgetCalculatorPage() {
  return (
    <AppShell>
      <BudgetCalculator />
    </AppShell>
  );
}
