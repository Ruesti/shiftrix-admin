"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const ALL_KPI = ["kpi:heute","kpi:offene-schichten","kpi:genehmigungen","kpi:auslastung","kpi:urlaub"] as const;
type KPIKey = (typeof ALL_KPI)[number];

export default function DashboardEditor({
  initialModules,
  onSave,
}: {
  initialModules: string[];
  onSave: (modules: string[]) => Promise<void>;
}) {
  const router = useRouter();
  const [mods, setMods] = useState<string[]>(initialModules);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const isActive = (m: KPIKey) => mods.includes(m);
  const toggle = (m: KPIKey) =>
    setMods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <h2 className="text-lg font-semibold">Seite anpassen</h2>

      <div className="flex flex-wrap gap-2">
        {ALL_KPI.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={isActive(m)}
            onClick={() => toggle(m)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              isActive(m) ? "border-white/40 bg-white/10" : "border-white/10 hover:border-white/25"
            }`}
          >
            {isActive(m) ? "✓ " : ""}{m}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              await onSave(mods);
              router.refresh();        // <- wichtig: frische Daten holen
              setMsg("Gespeichert.");
              setTimeout(() => setMsg(null), 1200);
            })
          }
          className="rounded-brand bg-orange-500/90 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Speichern…" : "Speichern"}
        </button>
        {msg && <span className="text-xs text-white/60">{msg}</span>}
      </div>
    </div>
  );
}
