// src/app/admin/projects/[id]/timeline/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

// Erzwinge dynamisches Rendering (falls ein Parent static params nutzt)
export const dynamic = "force-dynamic";
export const dynamicParams = true;

type ProjectRow = {
  id: string;
  name: string;
  description?: string | null;
  project_type?: string | null;
  start_date?: string | null; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  recurrence?: string | null;
  planned_headcount?: number | null;
  variable_headcount?: boolean | null;
  client_name?: string | null;
  location?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type ProjectPeriod = {
  id: string;
  project_id: string;
  label?: string | null;
  starts_at: string; // ISO datetime
  ends_at: string; // ISO datetime
  color?: string | null;
};

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function ProjectTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Projekt laden (maybeSingle: kein Error bei 0 Rows)
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle<ProjectRow>();

  if (!project) {
    // Falls die ID nicht existiert → 404
    return notFound();
  }

  const typeLabel =
    typeof project.project_type === "string" && project.project_type.length > 0
      ? project.project_type.toUpperCase()
      : "OPEN";
  const statusLabel = project.status ?? "PLANNED";

  // Zeitfenster/Phasen laden
  const { data: periods } = (await supabase
    .from("project_periods")
    .select("*")
    .eq("project_id", id)
    .order("starts_at", { ascending: true })) as {
    data: ProjectPeriod[] | null;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-white/60">
            {typeLabel} · {statusLabel}
            {project.start_date ? ` · ab ${project.start_date}` : ""}
            {project.end_date ? ` bis ${project.end_date}` : ""}
            {project.location ? ` · ${project.location}` : ""}
          </p>
          {project.client_name && (
            <p className="text-white/50 text-sm mt-1">
              Kunde: {project.client_name}
            </p>
          )}
          {project.description && (
            <p className="text-white/70 text-sm mt-2">{project.description}</p>
          )}
        </div>
      </header>

      {/* Zeitstrahl */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Zeitstrahl</h2>

        {!periods?.length && (
          <div className="rounded-brand border border-white/10 p-4 text-white/70">
            Noch keine Phasen/Zeitfenster angelegt.
          </div>
        )}

        <div className="space-y-3">
          {periods?.map((p) => (
            <div
              key={p.id}
              className="border border-white/10 rounded-brand p-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="font-medium">{p.label ?? "Zeitfenster"}</div>
                <div className="text-sm text-white/60">
                  {fmtDateTime(p.starts_at)} – {fmtDateTime(p.ends_at)}
                </div>
              </div>
              <div
                className="mt-2 h-2 w-full rounded-full"
                style={{ backgroundColor: p.color ?? "#F97316" }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
