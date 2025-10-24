"use client";

import { useState } from "react";
import type { ColumnKey, ColumnDef } from "./EmployeesClient";

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "").slice(0, 40);

export default function ColumnManager({
  columns,
  order,
  onChangeColumns,
  onChangeOrder,
}: {
  columns: ColumnDef[];
  order: ColumnKey[];
  onChangeColumns: (cols: ColumnDef[]) => void;
  onChangeOrder: (o: ColumnKey[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isCustomCol = (k: ColumnKey) => (k as string).startsWith("custom:");

  function setVisible(key: ColumnKey, visible: boolean) {
    onChangeColumns(columns.map((c) => (c.key === key ? { ...c, visible } : c)));
  }
  function setLabel(key: ColumnKey, label: string) {
    onChangeColumns(columns.map((c) => (c.key === key ? { ...c, label } : c)));
  }
  function addCustom() {
    setError(null);
    const label = newLabel.trim();
    if (!label) {
      setError("Bezeichnung eingeben");
      return;
    }
    const id = slugify(label);
    const key: ColumnKey = `custom:${id}` as ColumnKey;
    if (columns.some((c) => c.key === key)) {
      setError("Spalte existiert bereits");
      return;
    }
    onChangeColumns([...columns, { key, label, visible: true }]);
    onChangeOrder([...order, key]);
    setNewLabel("");
  }
  function removeCustom(key: ColumnKey) {
    if (!isCustomCol(key)) return;
    onChangeColumns(columns.filter((c) => c.key !== key));
    onChangeOrder(order.filter((k) => k !== key));
  }
  function move(key: ColumnKey, dir: -1 | 1) {
    const idx = order.indexOf(key);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChangeOrder(next);
  }

  return (
    <details className="ml-0 md:ml-auto">
      <summary className="cursor-pointer select-none text-sm text-white/80">Spalten</summary>
      <div className="mt-2 space-y-3 p-3 rounded-brand border border-white/10 bg-white/5 min-w-[280px]">
        <div className="space-y-2 max-h-64 overflow-auto pr-1">
          {order.map((k) => {
            const col = columns.find((c) => c.key === k)!;
            const isBuiltin = !isCustomCol(k);
            return (
              <div key={k} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={(e) => setVisible(k, e.target.checked)}
                  title="Sichtbar"
                />
                <input
                  value={col.label}
                  onChange={(e) => setLabel(k, e.target.value)}
                  className="flex-1 rounded-brand border border-white/10 bg-white/5 px-2 py-1 text-sm outline-none"
                  title="Spaltenbezeichnung"
                />
                <div className="flex items-center gap-1">
                  <button
                    className="px-2 py-1 rounded-brand border border-white/10"
                    onClick={() => move(k, -1)}
                    title="nach oben"
                  >
                    ↑
                  </button>
                  <button
                    className="px-2 py-1 rounded-brand border border-white/10"
                    onClick={() => move(k, 1)}
                    title="nach unten"
                  >
                    ↓
                  </button>
                  {!isBuiltin && (
                    <button
                      className="px-2 py-1 rounded-brand border border-white/10 text-red-300"
                      onClick={() => removeCustom(k)}
                      title="Spalte entfernen"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-top border-white/10 pt-3 space-y-2">
          <div className="text-xs text-white/60">Eigene Spalte hinzufügen</div>
          <div className="flex items-center gap-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Bezeichnung (z. B. Notiz)"
              className="flex-1 rounded-brand border border-white/10 bg-white/5 px-2 py-1 text-sm outline-none"
            />
            <button className="btn btn-primary text-sm px-3 py-1.5" onClick={addCustom}>
              Hinzufügen
            </button>
          </div>
          {error && <div className="text-xs text-red-300">{error}</div>}
        </div>
      </div>
    </details>
  );
}
