"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

export type Employee = {
  id: string;
  project_id: string | null;
  name: string;
  role: string | null;
  email: string | null;
  created_at: string;
};

export async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("id, project_id, name, role, email, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Employee[];
}

export async function createEmployeeAction(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  const role = String(fd.get("role") || "").trim() || null;
  const email = String(fd.get("email") || "").trim() || null;
  const project_id = String(fd.get("project_id") || "").trim() || null;

  if (!name) throw new Error("Name darf nicht leer sein.");

  const { error } = await supabase.from("employees").insert([{ name, role, email, project_id }]);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/employees");
}
