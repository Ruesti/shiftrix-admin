"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "../../../../components/AdminShell";
import { useEmployees, type Employee as Emp } from "../../../../store/employees";

/** Dieselben Keys wie in der Liste verwenden! */
const LS_COLUMNS = "shiftrix.employees.columns.v2";
const LS_ORDER   = "shiftrix.employees.order.v2";

const BUILTIN_KEYS = ["name","role","department","status","email","phone","hireDate"] as const;
type BuiltinKey = typeof BUILTIN_KEYS[number];
type ColumnKey  = BuiltinKey | `custom:${string}`;
type ColumnDef  = { key: ColumnKey; label: string; visible: boolean; };

const isCustom = (k: ColumnKey) => k.startsWith("custom:");
const customId = (k: ColumnKey) => (isCustom(k) ? k.slice(7) : "");

// ---- Parser/Guards für LocalStorage ----
function toColumnKey(k: string): ColumnKey {
  // wenn ein builtin, direkt übernehmen
  if ((BUILTIN_KEYS as readonly string[]).includes(k)) return k as BuiltinKey;
  // sonst als custom:... normalisieren
  const id = k.startsWith("custom:") ? k.slice(7) : k;
  return `custom:${id}` as ColumnKey;
}

function parseColumns(raw: unknown): ColumnDef[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c: any) => {
    const keyStr = String(c?.key ?? "");
    const key = toColumnKey(keyStr);
    const label = typeof c?.label === "string" && c.label.trim() ? c.label : keyStr || "Spalte";
    const visible = Boolean(c?.visible);
    return { key, label, visible };
  });
}

function parseOrder(raw: unknown): ColumnKey[] {
  if (!Array.isArray(raw)) return [];
  return (raw as any[]).map((k) => toColumnKey(String(k)));
}

export default function EmployeeDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { byId, update } = useEmployees();

  const emp = byId(params.id);
  const [form, setForm] = useState<Emp | null>(emp ?? null);

  // Spalten-Setup laden
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [order, setOrder] = useState<ColumnKey[]>([]);

  useEffect(() => {
    const cols = (() => {
      try {
        const s = localStorage.getItem(LS_COLUMNS);
        if (s) return parseColumns(JSON.parse(s));
      } catch {}
      // Fallback Builtins
      return [
        { key: "name" as BuiltinKey, label: "Name", visible: true },
        { key: "role" as BuiltinKey, label: "Rolle", visible: true },
        { key: "department" as BuiltinKey, label: "Abteilung", visible: true },
        { key: "status" as BuiltinKey, label: "Status", visible: true },
        { key: "email" as BuiltinKey, label: "E-Mail", visible: false },
        { key: "phone" as BuiltinKey, label: "Telefon", visible: false },
        { key: "hireDate" as BuiltinKey, label: "Eintritt", visible: false },
      ] satisfies ColumnDef[];
    })();

    const ord = (() => {
      try {
        const s = localStorage.getItem(LS_ORDER);
        if (s) return parseOrder(JSON.parse(s));
      } catch {}
      return cols.map((c) => c.key);
    })();

    setColumns(cols);
    setOrder(ord);
  }, []);

  useEffect(() => {
    // falls der Store die Daten nachträglich liefert
    if (!form && emp) setForm(emp);
  }, [emp, form]);

  const visibleCols = useMemo(
    () =>
      order
        .map((k) => columns.find((c) => c.key === k))
        .filter((c): c is ColumnDef => !!c && c.visible),
    [columns, order]
  );

  if (!emp || !form) {
    return (
      <AdminShell title="Mitarbeiter">
        <div className="card p-6">
          <div className="mb-4">Mitarbeiter nicht gefunden.</div>
          <button className="btn card border-white/20" onClick={() => router.push("/admin/employees")}>
            Zurück zur Liste
          </button>
        </div>
      </AdminShell>
    );
  }

 function setField(key: ColumnKey, value: string) {
  setForm((f) => {
    if (!f) return f;

    switch (key) {
      case "status":
        // im Admin nicht editierbar
        return f;

      case "name":
      case "role":
      case "department":
      case "email":
      case "phone":
      case "hireDate":
        return { ...f, [key]: value } as Emp;

      default: {
        // custom:<id>
        const cid = customId(key);
        return { ...f, custom: { ...(f.custom ?? {}), [cid]: value } };
      }
    }
  });
}


  const availability = useMemo(() => form?.availability ?? [], [form]);

  return (
    <AdminShell title={`Mitarbeiter #${emp.id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dynamische Felder */}
        <section className="card p-6 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-semibold">Stammdaten</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleCols.map((col) => {
              // Status wird read-only dargestellt (rechts im Kasten)
              if (col.key === "status") return null;

              const value = (() => {
                if (col.key === "name") return form.name;
                if (col.key === "role") return form.role;
                if (col.key === "department") return form.department;
                if (col.key === "email") return form.email ?? "";
                if (col.key === "phone") return form.phone ?? "";
                if (col.key === "hireDate") return form.hireDate ?? "";
                const cid = customId(col.key);
                return (form.custom ?? {})[cid] ?? "";
              })();

              const type =
                col.key === "email" ? "email" :
                col.key === "hireDate" ? "date" :
                "text";

              return (
                <Field
                  key={col.key}
                  label={col.label + (["name","role","department"].includes(col.key as string) ? "*" : "")}
                  value={value}
                  type={type}
                  onChange={(v) => setField(col.key, v)}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button className="btn card border-white/20" onClick={() => router.back()}>Abbrechen</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!form.name || !form.role || !form.department) return;
                update(emp.id, form);
                router.push("/admin/employees");
              }}
            >
              Speichern
            </button>
          </div>
        </section>

        {/* Status & Verfügbarkeit (read-only) */}
        <section className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Status & Verfügbarkeit</h3>

          <div>
            <label className="block text-xs text-white/60 mb-1">Status (nur in der Handy-App änderbar)</label>
            <div className="flex items-center gap-2">
              <input
                disabled
                value={form.status}
                readOnly
                className="w-full rounded-brand border border-white/10 bg-white/10 px-3 py-2 text-white/80"
              />
              <span className="text-xs text-white/60">🔒</span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Änderungen am Status erfolgen durch den/die Mitarbeiter:in in der mobilen App.
            </p>
          </div>

          <div>
            <div className="mb-2 text-sm text-white/70">Verfügbarkeiten (Anzeige)</div>
            <div className="space-y-2 max-h-60 overflow-auto pr-1">
              {availability.length === 0 && (
                <div className="text-white/50 text-sm">Keine Einträge vorhanden.</div>
              )}
              {availability.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-brand border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium">{a.type === "available" ? "Verfügbar" : "Nicht verfügbar"}</div>
                    <div className="text-white/60">{a.start} — {a.end}</div>
                  </div>
                  <span className={`text-xs ${a.type === "available" ? "text-green-300" : "text-red-300"}`}>
                    {a.type}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/50 mt-2">
              Verfügbarkeiten werden in der **Handy-App** vom/von der Mitarbeiter:in gepflegt.
            </p>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-white/60 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-brand border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-product-shiftrix/60"
      />
    </div>
  );
}
