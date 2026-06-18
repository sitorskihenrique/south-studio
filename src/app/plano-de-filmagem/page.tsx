import { AppShell } from "@/components/AppShell";
import { LoadingPanel } from "@/components/LoadingPanel";
import dynamic from "next/dynamic";

const FilmPlanTool = dynamic(
  () => import("@/components/film-plan/FilmPlanTool").then((mod) => mod.FilmPlanTool),
  { loading: () => <LoadingPanel label="Carregando plano de filmagem..." /> },
);

export default function FilmPlanPage() {
  return <AppShell><FilmPlanTool /></AppShell>;
}
