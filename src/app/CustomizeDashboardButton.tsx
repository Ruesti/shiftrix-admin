"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAdminDashboardModules } from "./actions/adminDashboard.server";
import { MODULE_OPTIONS } from "./admin/projects/moduleDefs";

export function CustomizeDashboardButton({
  initialActiveModules,
}: {
  initialActiveModules: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(initialActiveModules);
  const [isSaving, startTransition] = useTransition();
  const router = useRouter();

  function toggleModule(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function handleSave() {
    startTransition(async () => {
      await saveAdminDashboardModules(selected);
      setOpen(false);
      router.refresh(); // <-- holt Serverdaten neu (Seite bleibt)
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/30 transition"
      >
        Seite anpassen
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-xl bg-white/10 border border-white/20 p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-3">Angezeigte Module</h2>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {MODULE_OPTIONS.filter((m) => m.area === "admin").map((m) => {
                const active = selected.includes(m.key);
                return (
                  <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleModule(m.key)}
                    />
                    <span>{m.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="text-sm text-white/70 hover:text-white">
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-md bg-orange-500/80 hover:bg-orange-500 px-3 py-2 text-sm font-medium"
              >
                {isSaving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
