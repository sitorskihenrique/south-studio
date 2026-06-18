"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";
import { Field, SelectInput } from "@/components/budget/BudgetFields";
import { normalizeProjects, readProjects, writeProjects } from "@/lib/projects/storage";
import type { StudioProject } from "@/lib/projects/types";
import { readCloudItems } from "@/lib/supabase/data";

export function ProjectLinkField({ value, onChange }: { value: string; onChange: (projectId: string, project?: StudioProject) => void }) {
  const [projects, setProjects] = useState<StudioProject[]>([]);

  useEffect(() => {
    let mounted = true;
    setProjects(readProjects());
    readCloudItems<StudioProject>("projects").then((result) => {
      if (mounted && result.authenticated && result.ok) {
        const cloudProjects = normalizeProjects(result.items);
        setProjects(cloudProjects);
        writeProjects(cloudProjects);
      }
    });
    return () => { mounted = false; };
  }, []);

  const linked = projects.find((project) => project.id === value);
  return (
    <div>
      <Field label="Projeto vinculado">
        <SelectInput value={value} onChange={(event) => onChange(event.target.value, projects.find((project) => project.id === event.target.value))}>
          <option value="">Sem projeto</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </SelectInput>
      </Field>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={linked ? "font-semibold text-emerald-700" : "text-zinc-400"}>{linked ? `Vinculado a: ${linked.title}` : "Este item ainda não está vinculado a um projeto."}</span>
        <Link href="/projetos" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-zinc-200 px-3 font-semibold text-zinc-600"><FolderPlus size={14} />Criar projeto</Link>
      </div>
    </div>
  );
}
