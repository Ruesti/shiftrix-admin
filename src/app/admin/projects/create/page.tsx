"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectAction } from "../_actions/createProject";

// shadcn/ui
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const FormSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  project_type: z.enum(["bounded","open","recurring","adhoc"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  recurrence: z.string().optional(),
  planned_headcount: z.string().optional(),
  variable_headcount: z.boolean().optional(),
  client_name: z.string().optional(),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export default function CreateProjectPage() {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, setValue, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { project_type: "bounded", variable_headcount: false },
  });

  const projectType = watch("project_type") ?? "bounded";

  const onSubmit = (values: FormValues) => {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (typeof v === "boolean") fd.append(k, v ? "true" : "false");
      else if (v != null && v !== "") fd.append(k, v as string);
    });
    startTransition(() => { createProjectAction(fd); });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Projekt erstellen</h1>
        <p className="text-white/60">Neues Projekt anlegen, ohne bestehende Seiten zu verändern.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label>Projektname</Label>
          <Input placeholder="z. B. Messeaufbau Bremen" {...register("name")} />
          {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Projekttyp</Label>
          <Select defaultValue="bounded" onValueChange={(v: any) => setValue("project_type", v)}>
            <SelectTrigger><SelectValue placeholder="Typ wählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bounded">Zeitlich begrenzt (Start & Ende)</SelectItem>
              <SelectItem value="open">Laufend (ohne Enddatum)</SelectItem>
              <SelectItem value="recurring">Wiederkehrend</SelectItem>
              <SelectItem value="adhoc">Ad-hoc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(projectType === "bounded" || projectType === "recurring") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Startdatum</Label>
              <Input type="date" {...register("start_date")} />
            </div>
            {projectType === "bounded" && (
              <div className="space-y-2">
                <Label>Enddatum</Label>
                <Input type="date" {...register("end_date")} />
              </div>
            )}
          </div>
        )}

        {projectType === "recurring" && (
          <div className="space-y-2">
            <Label>Wiederholung (RRULE oder kurz)</Label>
            <Input placeholder="RRULE:FREQ=WEEKLY;BYDAY=MO,FR" {...register("recurrence")} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Geplante Teamgröße</Label>
            <Input type="number" min={0} placeholder="z. B. 6" {...register("planned_headcount")} />
          </div>
          <div className="flex items-center justify-between rounded-brand border border-white/10 p-3">
            <div>
              <Label>Variable Teamgröße</Label>
              <p className="text-xs text-white/60">Bedarf kann pro Tag/Schicht variieren</p>
            </div>
            <Controller name="variable_headcount" control={control} render={({ field }) => (
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            )} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kunde (optional)</Label>
            <Input placeholder="z. B. Agentur ABC" {...register("client_name")} />
          </div>
          <div className="space-y-2">
            <Label>Ort (optional)</Label>
            <Input placeholder="z. B. Messehalle 7, Bremen" {...register("location")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Beschreibung</Label>
          <Textarea rows={4} placeholder="Kurzbeschreibung, Besonderheiten…" {...register("description")} />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Erstelle…" : "Projekt erstellen"}
        </Button>
      </form>
    </div>
  );
}
