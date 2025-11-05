export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import ProjectRow from "./ProjectRow";

export default async function ProjectsPage() {
  const supabase = await supabaseServer();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, client_name, location, start_date, end_date, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projekte</h1>
        <Link
          href="/admin/projects/create"
          className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15 transition"
        >
          + Projekt erstellen
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left">
              <th>Name</th>
              <th>Auftraggeber</th>
              <th>Ort</th>
              <th>Zeitraum</th>
              <th className="w-1">Aktion</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {(projects ?? []).map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
            {projects?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-white/60">
                  Noch keine Projekte. Lege oben ein neues Projekt an.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
