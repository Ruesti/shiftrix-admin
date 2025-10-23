import { fetchProjects } from "./actions";
import { MODULE_OPTIONS, type ProjectRow } from "./modules";
import CreateProjectForm from "./CreateProjectForm";
import Link from "next/link";


export default async function ProjectsPage() {
  const list: ProjectRow[] = await fetchProjects();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projekte</h1>
        <p className="text-white/70">Admin kann Projekte anlegen und Module (Baukasten) aktivieren.</p>
      </header>

      <CreateProjectForm />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Deine Projekte</h2>
        {list.length === 0 ? (
          <p className="text-white/60">Noch keine Projekte angelegt.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((p) => (
              <li key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{p.name}</h3>
                    {p.description && <p className="text-sm text-white/70 mt-1">{p.description}</p>}
                  </div>
                  <span className="text-xs text-white/50">
                    {new Date(p.created_at).toLocaleDateString("de-DE")}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-white/50 mb-2">Aktive Module</p>
                  {p.modules && p.modules.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {p.modules.map((m) => {
                        const label = MODULE_OPTIONS.find((x) => x.key === m)?.label ?? m;
                        return (
                          <span key={m} className="text-xs rounded-md border border-white/15 bg-black/30 px-2 py-1">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">Keine Module aktiviert.</p>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
  <Link
    href={`/admin/projects/${p.id}`}
    className="text-sm rounded-md border border-white/10 px-3 py-1 hover:border-white/20 transition"
  >
    Öffnen
  </Link>
</div>

              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
