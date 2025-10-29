// src/app/admin/actions.server.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { ADMIN_SINGLETON_ID } from "./constants";

const SB_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;



function sb() {
  if (!SB_URL || !SB_ANON) {
    throw new Error("Supabase-Env fehlt (URL/ANON).");
  }
  return createClient(SB_URL, SB_ANON, { auth: { persistSession: false } });
}

export async function fetchDashboardModules(): Promise<string[]> {
  const client = sb();
  const { data, error } = await client
    .from("admin_dashboard_config")
    .select("modules")
    .eq("id", ADMIN_SINGLETON_ID)
    .single();

  if (error) {
    // Falls der Datensatz (noch) nicht existiert, lege ihn leer an
    await client
      .from("admin_dashboard_config")
      .upsert({ id: ADMIN_SINGLETON_ID, modules: [] });
    return [];
  }

  // modules ist jsonb (Array<string>)
  return (data?.modules ?? []) as string[];
}

export async function saveDashboardModules(mods: string[]) {
  const client = sb();
  const { error } = await client
    .from("admin_dashboard_config")
    .upsert({ id: ADMIN_SINGLETON_ID, modules: mods });

  if (error) throw error;
  // Seite neu validieren, damit die Widgets sofort aktualisieren
  revalidatePath("/admin");
}
