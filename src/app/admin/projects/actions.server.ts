"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { ProjectRow } from "./modules";
import type { ModuleKey } from "./moduleDefs";

function getSB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return undefined;
  return createClient(url, service, { auth: { persistSession: false } });
}

/* === Projektliste abrufen === */
export async function fetchProjects(): Promise<ProjectRow[] | null> {
  const sb = getSB();
  if (!sb) return null;

  const { data, error } = await sb
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/* === Einzelnes Projekt abrufen === */
export async function fetchProjectById(id: string): Promise<ProjectRow | null> {
  const sb = getSB();
  if (!sb) return null;

  const { data, error } = await sb
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/* === Neues Projekt anlegen === */
export async function createProjectAction(input: {
  name: string;
  description?: string;
  modules?: ModuleKey[];
  settings?: Record<string, unknown>;
}) {
  const sb = getSB();
  if (!sb)
    throw new Error(
      "Supabase-Env fehlt (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );

  const payload = {
    name: input.name,
    description: input.description ?? null,
    modules: input.modules ?? [],
    settings: input.settings ?? {},
    created_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("projects")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${data.id}`);
}

/* === Projekteinstellungen aktualisieren === */
export async function updateProjectSettings(projectId: string, settings: unknown) {
  const sb = getSB();
  if (!sb)
    throw new Error(
      "Supabase-Env fehlt (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );

  const { error } = await sb
    .from("projects")
    .update({ settings })
    .eq("id", projectId);

  if (error) throw error;

  revalidatePath(`/admin/projects/${projectId}`);
  return { ok: true };
}
