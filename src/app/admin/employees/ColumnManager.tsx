"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnKey, ColumnDef } from "./types";

type Props = {
  columns: ColumnDef[];
  order: ColumnKey[];
  onChangeColumns?: (cols: ColumnDef[]) => void;
  onChangeOrder?: (order: ColumnKey[]) => void;
  storageKey?: string; // Basis-Key für Persistenz
};

const LS_VIS = (k: string) => `${k}.visible`;
const LS_ORD = (k: string) => `${k}.order`;
const LS_LBL = (k: string) => `${k}.labels`;

export default function ColumnManager({
  columns,
  order,
  onChangeColumns,
  onChangeOrder,
  storageKey = "employees.columns",
}: Props) {
  // 1) SSR-stabiler Start: exakt die Props verwenden
  const [cols, setCols] = useState<ColumnDef[]>(columns);
  const [ord, setOrd] = useState<ColumnKey[]>(order);

  // 2) Nach Mount optionale Persistenz anwenden (kein Einfluss auf SSR-HTML)
  useEffect(() => {
    try {
      // Sichtbarkeiten
      const rawVis = localStorage.getItem(LS_VIS(storageKey));
      if (rawVis) {
        const vis = JSON.parse(rawVis) as Record<string, boolean>;
        setCols((prev) =>
          prev.map((c) => ({ ...c, visible: vis[String(c.key)] ?? c.visible }))
        );
      }
      // Labels
      const rawLbl = localStorage.getItem(LS_LBL(storageKey));
      if (rawLbl) {
        const lbl = JSON.parse(rawLbl) as Record<string, string>;
        setCols((prev) =>
          prev.map((c) => ({ ...c, label: lbl[String(c.key)] ?? c.label }))
        );
      }
      // Reihenfolge
      const rawOrd = localStorage.getItem(LS_ORD(storageKey));
      if (rawOrd) {
        const next = JSON.parse(rawOrd) as string[];
        const nextTyped = next.filter((k) =>
          // nur Keys übernehmen, die es gibt
          new Set(prevAllKeys(columns)).has(k)
        ) as ColumnKey[];
        if (nextTyped.length) setOrd(nextTyped);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const ordered = useMemo(() => {
    const map = new Map(cols.map((c) => [c.key, c]));
    const inOrder = ord.filter((k) => map.has(k)).map((k) => map.get(k)!);
    const rest = cols.filter((c) => !ord.includes(c.key));
    return [...inOrder, ...rest];
  }, [cols, ord]);

  // Persist-Helfer (nur nach State-Änderungen)
  const persist = (nextCols: ColumnDef[], nextOrd: ColumnKey[]) => {
    try {
      const visBag = Object.fromEntries(nextCols.map((c) => [String(c.key), c.visible]));
      const lblBag = Object.fromEntries(nextCols.map((c) => [String(c.key), c.label]));
      localStorage.setItem(LS_VIS(storageKey), JSON.stringify(visBag));
      localStorage.setItem(LS_LBL(storageKey), JSON.stringify(lblBag));
      localStorage.setItem(LS_ORD(storageKey), JSON.stringify(nextOrd));
    } catch {}
  };

  const setBoth = (nextCols: ColumnDef[], nextOrd: ColumnKey[] = ord) => {
    setCols(nextCols);
    onChangeColumns?.(nextCols);
    persist(nextCols, nextOrd);
  };
  const setOrderBoth = (nextOrd: ColumnKey[]) => {
    setOrd(nextOrd);
    onChangeOrder?.(nextOrd);
    persist(cols, nextOrd);
  };

  // Sichtbarkeit umschalten
  const toggle = (key: ColumnKey, v: boolean) =>
    setBoth(cols.map((c) => (c.key === key ? { ...c, visible: v } : c)));

  // Label bearbeiten
  const rename = (key: ColumnKey, label: string) =>
    setBoth(cols.map((c) => (c.key === key ? { ...c, label } : c)));

  // Reorder per ↑/↓
  const move = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= ordered.length) return;
    const next = [...ordered].map((c) => c.key);
    const [m] = next.splice(idx, 1);
    next.splice(to, 0, m);
    setOrderBoth(next);
  };

  // Eigene Spalte hinzufügen
  const inputRef = useRef<HTMLInputElement>(null);
  const addCustom = () => {
    const raw = (inputRef.current?.value || "").trim();
    if (!raw) return;
    const slug = slugify(raw);
    const key = (`custom:${slug}`) as ColumnKey;
    if (cols.some((c) => c.key === key)) {
      inputRef.current!.value = "";
      return;
    }
    const nextCols = [...cols, { key, label: raw, visible: true }];
    const nextOrd = [...ord, key];
    setBoth(nextCols, nextOrd);
    setOrderBoth(nextOrd);
    inputRef.current!.value = "";
  };

  // Nur custom-Spalten dürfen gelöscht werden
  const removeCustom = (key: ColumnKey) => {
    if (!String(key).startsWith("custom:")) return;
    const nextCols = cols.filter((c) => c.key !== key);
    const nextOrd = ord.filter((k) => k !== key);
    setBoth(nextCols, nextOrd);
    setOrderBoth(nextOrd);
  };

  const visibleCount = ordered.filter((c) => c.visible).length;

  return (
    <details className="ml-0 md:ml-6">
      <summary className="cursor-pointer select-none inline-flex items-center gap-2 text-white/80 hover:text-white">
        <span className="font-medium">Spalten</span>
        <span className="text-xs text-white/60">({visibleCount} sichtbar)</span>
      </summary>

      <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="max-h-72 overflow-y-auto pr-1">
          {ordered.map((col, idx) => {
            const canDel = String(col.key).startsWith("custom:");
            return (
              <div
                key={String(col.key)}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 mb-2 border border-white/10"
              >
                {/* Sichtbarkeit */}
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={col.visible}
                  onChange={(e) => toggle(col.key, e.currentTarget.checked)}
                />

                {/* Label-Input */}
                <input
                  value={col.label}
                  onChange={(e) => rename(col.key, e.currentTarget.value)}
                  className="flex-1 rounded-md bg-white/10 px-3 py-1.5 text-sm outline-none focus:ring-2 ring-white/20"
                />

                {/* Up / Down */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Nach oben"
                    className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    title="Nach unten"
                    className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
                    onClick={() => move(idx, +1)}
                    disabled={idx === ordered.length - 1}
                  >
                    ↓
                  </button>
                </div>

                {/* Löschen (nur custom) */}
                <button
                  type="button"
                  title={canDel ? "Spalte entfernen" : "Nur Custom-Spalten löschbar"}
                  className={`h-7 px-2 rounded-full border text-xs ${
                    canDel
                      ? "bg-white/10 hover:bg-white/15 border-white/10"
                      : "bg-white/5 border-white/5 cursor-not-allowed opacity-40"
                  }`}
                  onClick={() => canDel && removeCustom(col.key)}
                  disabled={!canDel}
                >
                  ×
                </button>
              </div>
            );
          })}
          {ordered.length === 0 && (
            <p className="text-sm text-white/60">Keine Spalten definiert.</p>
          )}
        </div>

        {/* Custom hinzufügen */}
        <div className="mt-3">
          <p className="text-xs text-white/60 mb-1">Eigene Spalte hinzufügen</p>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              placeholder="Bezeichnung (z. B. Notiz)"
              className="flex-1 rounded-md bg-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-white/20"
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustom();
              }}
            />
            <button
              type="button"
              className="rounded-xl bg-orange-500/90 hover:bg-orange-500 px-4 py-2 text-sm font-medium"
              onClick={addCustom}
            >
              Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}

/* ========= helpers ========= */

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function prevAllKeys(cols: ColumnDef[]) {
  return cols.map((c) => String(c.key));
}
