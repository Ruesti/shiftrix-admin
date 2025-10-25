// src/app/admin/projects/page.tsx
export const dynamic    = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime    = "nodejs";

import Link from "next/link";
import { fetchProjects, fetchProjectById } from "./actions.server"; // bzw. "./actions.server"

import { MODULE_OPTIONS, type ProjectRow } from "./modules";
import CreateProjectForm from "./CreateProjectForm";

const fmtDE = new Intl.DateTimeFormat("de-DE");

export default async function ProjectsPage() {
  let list: ProjectRow[] = [];
  try {
    const res = await fetchProjects();      // darf NULL/undefined zurückgeben, wenn ENV fehlt
    list = Array.isArray(res) ? res : [];
  } catch {
    // keine Exception nach oben werfen -> Build bleibt stabil
    list = [];
  }

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
          <div className="space-y-2">
            <p className="text-white/60">Noch keine Projekte angelegt <span className="text-white/30">oder Supabase nicht konfiguriert</span>.</p>
            <p className="text-xs text-white/40">Prüfe <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> und <code>SUPABASE_SERVICE_ROLE_KEY</code> in Vercel.</p>
          </div>
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
                    {fmtDE.format(new Date(p.created_at))}
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
