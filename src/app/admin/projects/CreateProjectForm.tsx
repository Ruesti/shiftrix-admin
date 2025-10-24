"use client";

import { useState, useTransition } from "react";
import { createProjectAction } from "./actions";
import { MODULE_OPTIONS, type ModuleKey } from "./moduleDefs";

export default function CreateProjectForm({
  defaultModules = ["shiftplan", "availability"] as ModuleKey[],
}) {
  const [selected, setSelected] = useState<ModuleKey[]>(defaultModules);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleModule(key: ModuleKey) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    fd.set("modules", JSON.stringify(selected));

    startTransition(async () => {
      try {
        await createProjectAction(fd);
        formEl.reset();
        setSelected(defaultModules);
      } catch (e: any) {
        setError(e?.message ?? "Unbekannter Fehler beim Erstellen.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <h2 className="text-xl font-semibold">Neues Projekt</h2>
      <p className="text-sm text-white/70 mb-4">
        Name, Beschreibung und Module wählen.
      </p>

      {/* Wichtig: onSubmit statt action */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm">Projektname</label>
          <input
            name="name"
            placeholder="z. B. Event Crew Herbst"
            className="w-full rounded-md bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-1 focus:ring-white/30"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Beschreibung (optional)</label>
          <textarea
            name="description"
            placeholder="Kurze Projektbeschreibung…"
            className="w-full min-h-[80px] rounded-md bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Module aktivieren</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {MODULE_OPTIONS.map((m) => {
              const active = selected.includes(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggleModule(m.key)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    active
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        active ? "bg-white/80" : "bg-white/30"
                      }`}
                    />
                    {m.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-brand bg-orange-500/90 px-4 py-2 text-sm font-medium shadow hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
          >
            {isPending ? "Erstelle…" : "Projekt erstellen"}
          </button>
          <span className="text-xs text-white/60">
            {isPending ? "Speichern…" : "Wird in Supabase gespeichert"}
          </span>
        </div>
      </form>
    </div>
  );
}
