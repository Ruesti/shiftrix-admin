"use client";

import { useState, useTransition } from "react";
import { updateProjectSettings } from "../actions.server";


export default function SettingsPanelClient({
  projectId,
  initialSettings,
}: {
  projectId: string;
  initialSettings: Record<string, any>;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(
    key: string,
    value: string | number | boolean | Record<string, any>
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      try {
        await updateProjectSettings(projectId, settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error("Fehler beim Speichern:", err);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Projekteinstellungen</h2>
      <p className="text-sm text-white/70 mb-4">
        Du kannst hier grundlegende Parameter des Projekts anpassen. Änderungen
        werden automatisch gespeichert und das Dashboard aktualisiert.
      </p>

      {/* Zeitzone */}
      <div>
        <label className="block text-sm mb-1">Zeitzone</label>
        <input
          type="text"
          value={settings.timezone ?? ""}
          onChange={(e) => handleChange("timezone", e.target.value)}
          className="w-full rounded-md bg-black/30 border border-white/10 px-3 py-2 outline-none focus:ring-1 focus:ring-white/30"
        />
      </div>

      {/* Arbeitszeit */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm mb-1">Arbeitsbeginn</label>
          <input
            type="time"
            value={settings.workday?.start ?? ""}
            onChange={(e) =>
              handleChange("workday", {
                ...settings.workday,
                start: e.target.value,
              })
            }
            className="w-full rounded-md bg-black/30 border border-white/10 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Arbeitsende</label>
          <input
            type="time"
            value={settings.workday?.end ?? ""}
            onChange={(e) =>
              handleChange("workday", {
                ...settings.workday,
                end: e.target.value,
              })
            }
            className="w-full rounded-md bg-black/30 border border-white/10 px-3 py-2"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-orange-500/90 px-4 py-2 text-sm font-medium shadow hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
        >
          {isPending ? "Speichern…" : "Speichern"}
        </button>
        {saved && <span className="text-green-400 text-sm">✓ Gespeichert</span>}
      </div>
    </form>
  );
}
