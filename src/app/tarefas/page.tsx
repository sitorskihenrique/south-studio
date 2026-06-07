import { AppShell } from "@/components/AppShell";
import { LoadingPanel } from "@/components/LoadingPanel";
import dynamic from "next/dynamic";

const TaskTool = dynamic(
  () => import("@/components/tasks/TaskTool").then((mod) => mod.TaskTool),
  { loading: () => <LoadingPanel label="Carregando tarefas..." /> },
);

export default function TasksPage() {
  return <AppShell><TaskTool /></AppShell>;
}
