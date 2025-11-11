// src/app/admin/projects/ProjectRow.tsx
import Link from "next/link";
import type { ProjectDB } from "@/types/project";

export default function ProjectRow({ project }: { project: ProjectDB }) {
  const name = project.name ?? "Unbenanntes Projekt";
  const client = project.client_name ?? "—";
  const loc = project.location ?? "—";
  const start = project.start_date
    ? new Date(project.start_date).toLocaleDateString()
    : "—";
  const end = project.end_date
    ? new Date(project.end_date).toLocaleDateString()
    : "—";

  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <div className="font-medium truncate">{name}</div>
        <div className="text-sm opacity-70 truncate">
          {client} · {loc} · {start} — {end}
        </div>
      </div>
      <Link
        href={`/admin/projects/${project.id}/edit`}
        className="shrink-0 rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15 transition"
      >
        Öffnen
      </Link>
    </div>
  );
}
