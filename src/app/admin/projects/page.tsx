import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import DeleteProjectForm from "./_components/DeleteProjectForm";

// dynamisches Rendering (nicht statisch cachen)
export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  name: string;
  project_type?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  created_at?: string | null;
};

export default async function ProjectsIndexPage() {
  const supabase = await supabaseServer();

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      "id,name,project_type,status,start_date,end_date,location,created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Projekte</h1>
        <p className="text-red-400">
          Fehler beim Laden: {error.message}
        </p>
        <Link
          href="/admin/projects/create"
          className="inline-block mt-4 rounded-brand bg-softbrew-blue px-4 py-2 text-white"
        >
          Projekt erstellen
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projekte</h1>
          <p className="text-white/60">
            Erstellen, ansehen, bearbeiten & löschen
          </p>
        </div>
        <Link
          href="/admin/projects/create"
          className="rounded-brand bg-softbrew-blue px-4 py-2 text-white hover:opacity-90 transition"
        >
          + Projekt erstellen
        </Link>
      </div>

      {/* Liste */}
      {!projects?.length ? (
        <div className="rounded-brand border border-white/10 p-6 text-white/70">
          Noch keine Projekte. Lege das erste an:
          <Link href="/admin/projects/create" className="ml-2 underline">
            Projekt erstellen
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p: ProjectRow) => {
            const type = p.project_type?.toUpperCase?.() ?? "OPEN";
            const status = p.status ?? "PLANNED";
            return (
              <li
                key={p.id}
                className="rounded-brand border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-white/60">
                    {type} · {status}
                    {p.start_date ? ` · ab ${p.start_date}` : ""}
                    {p.end_date ? ` bis ${p.end_date}` : ""}
                    {p.location ? ` · ${p.location}` : ""}
                  </div>
                </div>

                {/* Aktionen */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="px-3 py-1.5 rounded-brand border border-white/10 hover:bg-white/5"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/admin/projects/${p.id}/timeline`}
                    className="px-3 py-1.5 rounded-brand border border-white/10 hover:bg-white/5"
                  >
                    Timeline
                  </Link>
                  <Link
                    href={`/admin/projects/${p.id}?tab=edit`}
                    className="px-3 py-1.5 rounded-brand border border-white/10 hover:bg-white/5"
                  >
                    Bearbeiten
                  </Link>

                  {/* Client-Komponente */}
                  <DeleteProjectForm id={p.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
