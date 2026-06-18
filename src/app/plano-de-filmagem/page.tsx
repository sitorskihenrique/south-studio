import { AppShell } from "@/components/AppShell";
import { LoadingPanel } from "@/components/LoadingPanel";
import { FeaturePreviewLock } from "@/components/FeaturePreviewLock";
import dynamic from "next/dynamic";

const FilmPlanTool = dynamic(
  () => import("@/components/film-plan/FilmPlanTool").then((mod) => mod.FilmPlanTool),
  { loading: () => <LoadingPanel label="Carregando plano de filmagem..." /> },
);

export default function FilmPlanPage() {
  return (
    <AppShell>
      <FeaturePreviewLock
        title="Plano de Filmagem em breve."
        description="Estamos preparando um fluxo visual para organizar takes, roteiro, referências e cronograma em uma única experiência."
      >
        <FilmPlanTool />
      </FeaturePreviewLock>
    </AppShell>
  );
}
