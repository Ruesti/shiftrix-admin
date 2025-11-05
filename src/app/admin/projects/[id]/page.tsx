export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function ProjectIdRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/admin/projects/${params.id}/edit`);
}
