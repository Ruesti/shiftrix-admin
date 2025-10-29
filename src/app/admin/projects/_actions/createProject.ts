"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server"; // vorhandenen Helper weiterverwenden

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  project_type: z.enum(["bounded","open","recurring","adhoc"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  recurrence: z.string().optional(),
  planned_headcount: z.coerce.number().int().min(0).optional(),
  variable_headcount: z.coerce.boolean().optional(),
  client_name: z.string().optional(),
  location: z.string().optional(),
});

export async function createProjectAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = schema.parse(raw);

  if (data.project_type === "bounded" && (!data.start_date || !data.end_date)) {
    throw new Error("Für zeitlich begrenzte Projekte sind Start- und Enddatum erforderlich.");
  }
  if (data.project_type === "recurring" && (!data.start_date || !data.recurrence)) {
    throw new Error("Für wiederkehrende Projekte sind Startdatum und Wiederholung erforderlich.");
  }

  const supabase = await supabaseServer();

  const { data: inserted, error } = await supabase
    .from("projects")
    .insert({
      name: data.name,
      description: data.description ?? null,
      project_type: data.project_type,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      recurrence: data.recurrence ?? null,
      planned_headcount: data.planned_headcount ?? null,
      variable_headcount: data.variable_headcount ?? false,
      client_name: data.client_name ?? null,
      location: data.location ?? null,
      status: "planned",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // kleinen Default-Zeitraum nur für 'bounded'
  if (data.project_type === "bounded" && data.start_date && data.end_date) {
    await supabase.from("project_periods").insert({
      project_id: inserted!.id,
      label: "Phase 1",
      starts_at: `${data.start_date}T08:00:00Z`,
      ends_at: `${data.end_date}T18:00:00Z`,
      color: "#F97316",
    });
  }

  redirect(`/admin/projects/${inserted!.id}/timeline`);
}
