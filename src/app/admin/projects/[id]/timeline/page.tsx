import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type ProjectPeriod = {
  id: string;
  label?: string;
  starts_at: string;
  ends_at: string;
  color?: string;
};

export default async function ProjectTimelinePage(
  { params }: { params: Promise<{ id: string }> }  // 👈 Next 15: Promise
) {
  const { id } = await params;                      // 👈 auflösen

  const supabase = await supabaseServer();          // 👈 deine async Factory

  const [{ data: project }, { data: periods }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase
      .from("project_periods")
      .select("*")
      .eq("project_id", id)
      .order("starts_at", { ascending: true }),
  ]);

  if (!project) return notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-white/60">
            {project.project_type.toUpperCase()} · {project.status}
            {project.start_date ? ` · ab ${project.start_date}` : ""}
            {project.end_date ? ` bis ${project.end_date}` : ""}
          </p>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Zeitstrahl</h2>
        <div className="space-y-3">
          {(!periods || periods.length === 0) && (
            <p className="text-white/60">Noch keine Phasen/Zeitfenster angelegt.</p>
          )}
          {(periods ?? []).map((p: ProjectPeriod) => (
            <div key={p.id} className="border border-white/10 rounded-brand p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{p.label ?? "Zeitfenster"}</div>
                <div className="text-sm text-white/60">
                  {new Date(p.starts_at).toLocaleString()} – {new Date(p.ends_at).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 h-2 w-full rounded-full" style={{ backgroundColor: p.color ?? "#F97316" }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
