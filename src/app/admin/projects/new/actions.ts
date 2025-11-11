// app/admin/projects/new/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const orgId = String(formData.get("orgId") || "").trim();
  if (!name) throw new Error("Projektname fehlt.");

  const supabase = await createClient();

  // 1) Projekt anlegen
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert({ name, org_id: orgId || null })
    .select()
    .single();
  if (pErr || !project) {
    throw new Error(pErr?.message || "Projekt konnte nicht angelegt werden");
  }

  // 2) Alle echten Mitarbeiter holen (keine Dummies)
  const { data: employees, error: eErr } = await supabase
    .from("employees")
    .select("id" + (orgId ? ", org_id" : ""))
    .order("id");
  if (eErr) throw new Error(eErr.message);

  // Optional: nach orgId filtern, wenn ihr Organisationen nutzt
  const filtered = (employees ?? []).filter((e: any) =>
    orgId ? e.org_id === orgId : true
  );

  // 3) Projekt-Mitgliedschaften anlegen
  if (filtered.length > 0) {
    const rows = filtered.map((e: any) => ({
      project_id: project.id,
      employee_id: e.id,
    }));
    const { error: mErr } = await supabase.from("project_members").insert(rows);
    if (mErr) throw new Error(mErr.message);
  }

  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${project.id}`);
}
