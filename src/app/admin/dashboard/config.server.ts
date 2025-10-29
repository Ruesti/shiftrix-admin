import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export const ADMIN_CONFIG_ID = "11111111-1111-1111-1111-111111111111";

function sbServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase-Env fehlt (URL/Service-Key).");
  return createClient(url, key);
}

export async function fetchAdminModules() {
  const sb = sbServer();
  const { data, error } = await sb
    .from("admin_dashboard_config")
    .select("modules")
    .eq("id", ADMIN_CONFIG_ID)
    .single();
  if (error) throw error;
  return (data?.modules ?? []) as string[];
}

export async function saveAdminModules(modules: string[]) {
  "use server";
  const sb = sbServer();
  const { error } = await sb
    .from("admin_dashboard_config")
    .upsert({
      id: ADMIN_CONFIG_ID,
      modules,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  // <- wichtig: Server-Cache/SSG invalidieren
  revalidatePath("/admin");
}
