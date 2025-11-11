// app/admin/projects/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";

type Employee = {
  id: string;
  name: string | null;
  role: string | null;
  department: string | null;
};

export const revalidate = 0; // immer frische Daten

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = params.id;
  const supabase = await createClient();

  // 1) Projekt laden
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (pErr || !project) {
    return (
      <section className="p-6">
        <div className="text-red-500">
          Projekt nicht gefunden: {pErr?.message ?? "Unbekannter Fehler"}
        </div>
      </section>
    );
  }

  // 2) Mitglieds-IDs aus project_members laden (nur die IDs, keine verschachtelten Tabellen)
  const { data: memberRows, error: mErr } = await supabase
    .from("project_members")
    .select("employee_id")
    .eq("project_id", projectId);

  if (mErr) {
    return (
      <section className="p-6">
        <div className="text-red-500">
          Mitglieder konnten nicht geladen werden: {mErr.message}
        </div>
      </section>
    );
  }

  const memberIds = (memberRows ?? [])
    .map((r) => r.employee_id as string)
    .filter(Boolean);

  // 3) Mitarbeiter laden (wenn keine IDs, dann leere Liste)
  let employees: Employee[] = [];
  if (memberIds.length > 0) {
    const { data: emps, error: eErr } = await supabase
      .from("employees")
      .select("id, name, role, department")
      .in("id", memberIds)
      .order("name", { ascending: true });

    if (eErr) {
      return (
        <section className="p-6">
          <div className="text-red-500">
            Mitarbeiter konnten nicht geladen werden: {eErr.message}
          </div>
        </section>
      );
    }

    employees = (emps ?? []) as Employee[];
  }

  return (
    <section className="p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-sm opacity-70">Projekt-ID: {project.id}</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Mitgliederliste */}
        <div className="space-y-3">
          <h2 className="text-xl font-medium">Mitglieder</h2>
          <ul className="space-y-2">
            {employees.map((e) => (
              <li key={e.id} className="rounded border border-white/10 p-3">
                <div className="font-medium">{e.name ?? "–"}</div>
                <div className="text-sm opacity-70">
                  {(e.role ?? "–") + " · " + (e.department ?? "–")}
                </div>
              </li>
            ))}
            {employees.length === 0 && (
              <li className="opacity-70">Noch keine Mitglieder verknüpft.</li>
            )}
          </ul>
        </div>

        {/* Rollenverwaltung (Client-Komponente) */}
        <div className="space-y-3">
          <h2 className="text-xl font-medium">Rollen</h2>
          {/* Falls du die RoleManager-Komponente nutzt, hier importieren & einbinden */}
          {/* <RoleManager projectId={projectId} /> */}
          <p className="text-sm opacity-70">
            (RoleManager hier einfügen, wenn vorhanden)
          </p>
        </div>
      </div>
    </section>
  );
}
