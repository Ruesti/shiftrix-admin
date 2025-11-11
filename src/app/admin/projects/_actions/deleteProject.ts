"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteProjectAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, error: "Projekt-ID fehlt." };

  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    console.error("deleteProjectAction:", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/projects");
  return { ok: true };
}
