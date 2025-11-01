"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Upsert einer Zuweisung: pro (project_id, role_id) genau EIN Eintrag
 * employee_id = null → Zuweisung entfernen
 */
export async function upsertAssignmentAction(opts: {
  project_id: string;
  role_id: string;
  employee_id: string | null;
  starts_on?: string | null;
  ends_on?: string | null;
}): Promise<void> {
  const { project_id, role_id, employee_id, starts_on = null, ends_on = null } = opts;
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

  const { error } = await supabase
    .from("project_assignments")
    .upsert(
      { project_id, role_id, employee_id, starts_on, ends_on },
      { onConflict: "project_id,role_id" } // erfordert UNIQUE(project_id, role_id)
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${project_id}/edit`);
}

/**
 * Neue Rolle für ein Projekt anlegen
 */
export async function addRoleAction(project_id: string, label: string): Promise<void> {
  const supabase = await supabaseServer();

  // einfache Sortierung: max(sort_index)+1
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
export async function deleteRoleAction(project_id: string, role_id: string): Promise<void> {
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
