"use client";

import { useEffect, useMemo, useState } from "react";

type Column = {
  key: string;
  label: string;
  visible: boolean;
  builtin?: boolean;
};

type Props = {
  columns: Column[];                 // vom Server/Eltern
  order: string[];                   // gewünschte Reihenfolge der keys
  onChangeColumns?: (cols: Column[]) => void;
  storageKey?: string;               // optionaler Key für localStorage
};

export default function ColumnManager({
  columns,
  order,
  onChangeColumns,
  storageKey = "employees.columns",
}: Props) {
  // 1) SSR-stabil: initialer State = Props (kein window/localStorage!)
  const [cols, setCols] = useState<Column[]>(columns);

  // 2) Nach Mount hydrieren wir optional Client-Overrides
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const saved = JSON.parse(raw) as Partial<Record<string, boolean>>;
      // Nur Sichtbarkeit übernehmen, nichts hinzufügen/entfernen
      setCols((prev) =>
        prev.map((c) => ({ ...c, visible: saved[c.key] ?? c.visible }))
      );
    } catch {
      // still – nie die SSR-HTML ändern, wenn parsing fehlschlägt
    }
  }, [storageKey]);

  // 3) Deterministische Reihenfolge: erst `order`, dann Rest – keine locale-abhängige Sortierung
  const ordered = useMemo(() => {
    const byKey = new Map(cols.map((c) => [c.key, c]));
    const inOrder = order.filter((k) => byKey.has(k)).map((k) => byKey.get(k)!);
    const rest = cols.filter((c) => !order.includes(c.key));
    return [...inOrder, ...rest];
  }, [cols, order]);

  // 4) Handler: State setzen, Parent informieren, und (nur am Client) speichern
  const toggle = (key: string, nextVisible: boolean) => {
    setCols((prev) => {
      const next = prev.map((c) => (c.key === key ? { ...c, visible: nextVisible } : c));
      onChangeColumns?.(next);
      try {
        const bag = Object.fromEntries(next.map((c) => [c.key, c.visible]));
        localStorage.setItem(storageKey, JSON.stringify(bag));
      } catch {}
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {ordered.map((col) => (
        <div key={col.key} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={col.visible}
            onChange={(e) => toggle(col.key, e.currentTarget.checked)}
          />
          <span className="text-sm">{col.label}</span>
        </div>
      ))}
    </div>
  );
}
