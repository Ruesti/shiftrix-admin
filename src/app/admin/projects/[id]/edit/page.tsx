export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import ProjectEditorClient from "./ProjectEditorClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: roles }, { data: assignments }, { data: employees }] =
    await Promise.all([
      supabase
        .from("project_roles")
        .select("id, project_id, label, color, sort_index")
        .eq("project_id", id)
        .order("sort_index", { ascending: true }),
      supabase
        .from("project_assignments")
        .select(
          "id, project_id, role_id, employee_id, starts_on, ends_on, note"
        )
        .eq("project_id", id),
      supabase
        .from("employees")
        .select("id, name, role, availability")
        .order("name"),
    ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Projekt bearbeiten</h1>
        <p className="text-white/60 text-sm">{project.name}</p>
      </div>

      <ProjectEditorClient
        project={project}
        initialRoles={roles ?? []}
        initialAssignments={assignments ?? []}
        initialEmployees={(employees ?? []).map((e) => ({
          id: e.id,
          name: e.name,
          role: e.role ?? undefined,
          availability: (e.availability ?? "available") as any,
        }))}
      />
    </section>
  );
}
