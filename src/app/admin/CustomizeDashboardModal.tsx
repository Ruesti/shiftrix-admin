// src/app/admin/CustomizeDashboardModal.tsx
"use client";

import { useState, useTransition } from "react";
import { saveDashboardModules } from "./actions.server";
import { useRouter } from "next/navigation";

import { KPI_OPTIONS } from "./kpiDefs";



type Props = {
  initialSelected: string[];
};

export default function CustomizeDashboardModal({ initialSelected }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function toggle(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSave() {
    setErr(null);
    startTransition(async () => {
      try {
        await saveDashboardModules(selected);
        setOpen(false);
        router.refresh();
      } catch (e: any) {
        setErr(e?.message ?? "Speichern fehlgeschlagen.");
      }
    });
  }

  return (
    <>
      <button
        className="rounded-brand bg-orange-500/90 px-4 py-2 text-sm font-medium shadow hover:shadow-lg active:scale-[0.99]"
        onClick={() => setOpen(true)}
      >
        Seite anpassen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">KPI-Widgets auswählen</h3>
              <button
                className="rounded-md border border-white/10 px-2 py-1 text-sm hover:border-white/20"
                onClick={() => setOpen(false)}
              >
                Schließen
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {KPI_OPTIONS.map((opt) => {
                const active = selected.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggle(opt.key)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                      active
                        ? "border-white/30 bg-white/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        active ? "bg-white/80" : "bg-white/30"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="rounded-brand bg-emerald-500/90 px-4 py-2 text-sm font-medium shadow hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
              >
                {isPending ? "Speichere…" : "Speichern"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm hover:border-white/20"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
