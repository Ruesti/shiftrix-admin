// src/app/admin/projects/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProjectRow from "./ProjectRow";
import type { ProjectDB } from "@/types/project";

export const revalidate = 0;

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, org_id, client_name, location, start_date, end_date, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="p-6">
        <div className="text-red-500">Fehler: {error.message}</div>
      </section>
    );
  }

  const projects = (data ?? []) as ProjectDB[];

  return (
    <section className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projekte</h1>
        <Link
          href="/admin/projects/new"
          className="rounded bg-white/10 px-4 py-2 hover:bg-white/15 transition"
        >
          Neues Projekt
        </Link>
      </header>

      {projects.length === 0 ? (
        <div className="opacity-70">Noch keine Projekte.</div>
      ) : (
        <div className="divide-y divide-white/10">
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}
