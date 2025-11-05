"use client";

import { useRouter } from "next/navigation";
import DeleteProjectButton from "./DeleteProjectButton";

type Project = {
  id: string;
  name: string;
  client_name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
};

export default function ProjectRow({ project }: { project: Project }) {
  const router = useRouter();

  const start = project.start_date
    ? new Date(project.start_date).toLocaleDateString("de-DE")
    : "—";
  const end = project.end_date
    ? new Date(project.end_date).toLocaleDateString("de-DE")
    : "";
  const Zeitraum = end ? `${start} – ${end}` : start;

  const editHref = `/admin/projects/${project.id}/edit`;

  return (
    <tr
      className="group cursor-pointer hover:bg-white/5"
      onClick={() => router.push(editHref)}
    >
      <td className="px-4 py-3 font-medium">{project.name}</td>
      <td className="px-4 py-3 text-white/80">{project.client_name ?? "—"}</td>
      <td className="px-4 py-3 text-white/80">{project.location ?? "—"}</td>
      <td className="px-4 py-3 text-white/70">{Zeitraum}</td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <DeleteProjectButton id={project.id} />
      </td>
    </tr>
  );
}
