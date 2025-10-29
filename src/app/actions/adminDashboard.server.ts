"use server";

import { createClient } from "@supabase/supabase-js";

function getSB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, { auth: { persistSession: false } });
}

export async function loadAdminDashboardModules(): Promise<string[]> {
  const sb = getSB();
  const { data, error } = await sb
    .from("admin_dashboard_config")
    .select("modules")
    .limit(1)
    .single();

  if (error) return [];
  return data?.modules ?? [];
}

export async function saveAdminDashboardModules(modules: string[]) {
  const sb = getSB();

  // Wenn noch kein Eintrag existiert, einfach Insert
  const { error } = await sb
    .from("admin_dashboard_config")
    .upsert({ modules, updated_at: new Date().toISOString() });

  if (error) throw error;
  return { success: true };
}
