"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/* -----------------------------------------------------------
   Kleine Helfer: Session & Ownership prüfen
----------------------------------------------------------- */

async function getUserIdOrThrow(): Promise<string> {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) {
    throw new Error("Nicht eingeloggt.");
  }
  return data.user.id;
}

/** Prüft, ob der eingeloggte User Owner des Projekts ist.
 *  (Wenn du später project_members nutzt, kann man das hier erweitern.)
 */
async function assertProjectOwner(project_id: string): Promise<void> {
  const sb = await supabaseServer();

  // Sichtbarkeit/Ownership per RLS-fähiger Query prüfen
  const { data: proj, error } = await sb
    .from("projects")
    .select("id, created_by")
    .eq("id", project_id)
    .single();

  if (error) {
    // Häufig: fehlende SELECT-Policy auf projects → RLS schlägt schon hier zu.
    throw new Error("Projekt nicht sichtbar (RLS auf 'projects').");
  }

  const userId = await getUserIdOrThrow();
  if (proj.created_by !== userId) {
    throw new Error("Kein Zugriff: Du bist nicht Owner dieses Projekts.");
  }
}

/* -----------------------------------------------------------
   Zuweisungen (Assignments)
----------------------------------------------------------- */

/**
 * Upsert einer Zuweisung: pro (project_id, role_id) genau EIN Eintrag
 * employee_id = null → Zuweisung entfernen
 */
export async function upsertAssignmentAction(opts: {
  project_id: string;
  role_id: string; // muss eine echte UUID aus project_roles sein
  employee_id: string | null; // muss eine echte UUID aus employees sein oder null
  starts_on?: string | null;
  ends_on?: string | null;
}): Promise<void> {
  const {
    project_id,
    role_id,
    employee_id,
    starts_on = null,
    ends_on = null,
  } = opts;

  // Ownership prüfen (liefert frühe, klare Fehlermeldung statt generischem RLS-Error)
  await assertProjectOwner(project_id);

  const supabase = await supabaseServer();

  if (!employee_id) {
    const { error } = await supabase
      .from("project_assignments")
      .delete()
      .match({ project_id, role_id });

    if (error) throw new Error(error.message);
    revalidatePath(`/admin/projects/${project_id}/edit`);
    return;
  }

  const { error } = await supabase.from("project_assignments").upsert(
    { project_id, role_id, employee_id, starts_on, ends_on },
    { onConflict: "project_id,role_id" } // erfordert UNIQUE(project_id, role_id)
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${project_id}/edit`);
}

/* -----------------------------------------------------------
   Rollen (project_roles)
----------------------------------------------------------- */

/**
 * Neue Rolle für ein Projekt anlegen
 */
export async function addRoleAction(
  project_id: string,
  label: string
): Promise<void> {
  await assertProjectOwner(project_id);

  const supabase = await supabaseServer();

  // sort_index = max(sort_index) + 1 (SELECT erfordert SELECT-Policy auf project_roles)
  const { data: maxRow, error: maxErr } = await supabase
    .from("project_roles")
    .select("sort_index")
    .eq("project_id", project_id)
    .order("sort_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxErr) throw new Error(maxErr.message);

  const nextSort = (maxRow?.sort_index ?? -1) + 1;

  const { error } = await supabase
    .from("project_roles")
    .insert({ project_id, label, sort_index: nextSort });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${project_id}/edit`);
}

/**
 * Rolle umbenennen
 */
export async function renameRoleAction(
  project_id: string,
  role_id: string,
  label: string
): Promise<void> {
  await assertProjectOwner(project_id);

  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("project_roles")
    .update({ label })
    .eq("id", role_id)
    .eq("project_id", project_id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${project_id}/edit`);
}

/**
 * Rolle löschen (inkl. evtl. zugehöriger Zuweisungen – je nach FK-Constraint)
 */
export async function deleteRoleAction(
  project_id: string,
  role_id: string
): Promise<void> {
  await assertProjectOwner(project_id);

  const supabase = await supabaseServer();

  // Optional: zugehörige Assignments zuerst löschen, falls FK nicht ON DELETE CASCADE ist
  const { error: delAssErr } = await supabase
    .from("project_assignments")
    .delete()
    .match({ project_id, role_id });

  if (delAssErr) throw new Error(delAssErr.message);

  const { error } = await supabase
    .from("project_roles")
    .delete()
    .eq("id", role_id)
    .eq("project_id", project_id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${project_id}/edit`);
}
