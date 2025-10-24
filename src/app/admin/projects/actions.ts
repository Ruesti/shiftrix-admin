// src/app/admin/projects/actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { ModuleKey, ProjectRow } from "./modules";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
  ]
    .filter(Boolean)
    .join(", ");
  throw new Error(
    `Supabase-Env fehlt: ${missing}. Prüfe .env.local und starte den Dev-Server neu.`
  );
}

function getAdminClient() {
  return createClient(url!, serviceKey!, { auth: { persistSession: false } });
}

// Server Action: Projekte laden (Server Component nutzt das)
export async function fetchProjects(): Promise<ProjectRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,description,created_at,modules,settings")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectRow[];
}
export async function fetchProjectById(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,description,created_at,modules,settings")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}


// Server Action: Projekt anlegen (Client-Form ruft das auf)
export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const modules = (JSON.parse(String(formData.get("modules") || "[]")) ||
    []) as ModuleKey[];

  if (!name) throw new Error("Projektname darf nicht leer sein.");

  const settings = {
    workday: { start: "08:00", end: "18:00" },
    locale: "de-DE",
    timezone: "Europe/Berlin",
    colors: { primary: "#F97316" },
  };

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("projects")
    .insert([{ name, description, modules, settings }]);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/projects");
}

export async function updateProjectSettings(
  id: string,
  newSettings: Record<string, any>
) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ settings: newSettings })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Seite aktualisieren
  revalidatePath(`/admin/projects/${id}`);
}
