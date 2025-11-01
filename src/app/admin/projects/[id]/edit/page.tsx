// Server Component
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase/server";
import ProjectEditorClient from "./ProjectEditorClient"; // <-- Client-Komponente importieren

export const metadata: Metadata = { title: "Projekt bearbeiten" };

export default async function ProjectEditPage({ params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const projectId = params.id;

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, name, description, project_type, start_date, end_date, recurrence, planned_headcount, variable_headcount, client_name, location, status, created_at"
    )
    .eq("id", projectId)
    .single();

  if (pErr || !project) return notFound();

  const { data: roles } = await supabase
    .from("project_roles")
    .select("id, label, color, sort_index")
    .eq("project_id", projectId)
    .order("sort_index", { ascending: true });

  const { data: assignments } = await supabase
    .from("project_assignments")
    .select("id, role_id, employee_id, starts_on, ends_on, note")
    .eq("project_id", projectId);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/admin/projects/${project.id}`}
            className="text-sm text-white/70 hover:text-white/90 underline underline-offset-4"
          >
            ← Zurück zur Projektansicht
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-xs text-white/50 mt-1">
            Angelegt am {new Date(project.created_at).toLocaleDateString("de-DE")}
          </p>
        </div>
        <Link
          href={`/admin/projects/${project.id}`}
          className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 transition"
        >
          Zur Ansicht
        </Link>
      </div>

      {/* Client-Komponente */}
      <ProjectEditorClient
        project={project}
        initialRoles={roles ?? []}
        initialAssignments={assignments ?? []}
      />
    </section>
  );
}
