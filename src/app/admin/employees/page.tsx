// app/admin/employees/page.tsx
import { createClient } from "@/lib/supabase/server";

type Employee = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
};

export const revalidate = 0; // immer frische Daten

export default async function EmployeesPage() {
  const supabase = await createClient();

  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, name, email, role, department")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-4 text-red-500">Fehler beim Laden: {error.message}</div>
    );
  }

  const list = (employees ?? []) as Employee[];

  return (
    <section className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Mitarbeiter</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((e) => (
          <div key={e.id} className="rounded border border-white/10 p-4">
            <div className="font-medium">{e.name || "–"}</div>
            <div className="text-sm opacity-70">{e.email || "–"}</div>
            <div className="text-sm opacity-70">
              {e.role || "–"} · {e.department || "–"}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="opacity-70">Keine Mitarbeiter gefunden.</div>
        )}
      </div>
    </section>
  );
}
