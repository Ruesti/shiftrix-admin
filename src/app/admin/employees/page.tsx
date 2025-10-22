"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "../../../components/AdminShell";
import { Pagination } from "../../../components/Pagination";
import { useEmployees, type Employee as Emp, type Availability } from "../../../store/employees";

/** ==== Organisationsweite Anzeige-Policy (nur Visualisierung) ==== */
const ORG_AVAIL_POLICY = {
  defaultGranularity: "day" as "day" | "shift" | "hour",
  shiftStart: "08:00",        // Start der ersten Schicht
  shiftLengthHours: 8,        // z. B. 8-Stunden-Schichten
  shiftsPerDay: 1,            // 1 = Tagschicht; 2–3 für Früh/Spät/Nacht
};

/** ==== Typen ==== */
type BuiltinKey = "name" | "role" | "department" | "status" | "email" | "phone" | "hireDate";
type ColumnKey = BuiltinKey | `custom:${string}`;
type ColumnDef = { key: ColumnKey; label: string; visible: boolean };

/** ==== Dummy-Daten (Initial) ==== */
const FIRST = ["Alex", "Sam", "Mila", "Jonas", "Lea", "Paul", "Nora", "Tom", "Eva", "Jan", "Sara", "Luca", "Marek", "Aylin", "Ben"];
const LAST  = ["Schmidt", "Meyer", "Fischer", "Weber", "Wagner", "Becker", "Hoffmann", "Klein", "Wolf", "Neumann", "Schwarz", "Braun"];
const ROLES = ["Schichtleiter:in", "Teammitglied", "Dispo", "HR", "Backoffice", "Technik"];
const DEPTS = ["Lager", "Kasse", "Service", "Produktion", "Bühne", "Logistik"];
const STATS: Emp["status"][] = ["aktiv", "inaktiv", "urlaub"];

/** ======= Local-time Helpers (kein UTC/`Z`) ======= */
const pad2 = (n: number) => String(n).padStart(2, "0");
const dayKeyLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3,"0")}`;

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
const DAY_MS = 24 * 60 * 60 * 1000;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Dummy-Verfügbarkeiten (lokale Zeiten ohne 'Z') */
function randAvail(): Availability[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (Y: number, M: number, D: number, hh = 9, mm = 0) =>
    `${Y}-${pad(M + 1)}-${pad(D)}T${pad(hh)}:${pad(mm)}:00.000`; // kein 'Z'!

  return [
    { start: iso(y, m, 2, 0, 0),  end: iso(y, m, 2, 23, 59), type: "available" },
    { start: iso(y, m, 6, 8, 0),  end: iso(y, m, 6, 16, 0),  type: "available" },
    { start: iso(y, m, 10,10, 0), end: iso(y, m, 10,12, 0), type: "unavailable" },
    { start: iso(y, m, 12,22, 0), end: iso(y, m, 13, 6, 0), type: "available" }, // über Nacht
    { start: iso(y, m, 15, 0, 0), end: iso(y, m, 17,23,59), type: "unavailable" }, // mehrtägig
    { start: iso(y, m-1,24, 8, 0), end: iso(y, m-1,24,16, 0), type: "available" },
  ];
}

function makeEmployees(n = 24): Emp[] {
  return Array.from({ length: n }).map((_, i) => {
    const f = FIRST[i % FIRST.length];
    const l = LAST[i % LAST.length];
    const email = `${f}.${l}`.toLowerCase().replace(/[^a-z.]/g, "") + "@firma.de";
    const phone = "+49 151 " + String(1000000 + i * 73).slice(0, 7);
    const y = 2020 + (i % 5);
    const m = String(((i % 12) + 1)).padStart(2, "0");
    const d = String(((i % 28) + 1)).padStart(2, "0");
    return {
      id: String(i + 1).padStart(3, "0"),
      name: `${f} ${l}`,
      role: ROLES[i % ROLES.length],
      department: DEPTS[(i * 2) % DEPTS.length],
      status: STATS[(i * 3) % STATS.length],
      email,
      phone,
      hireDate: `${y}-${m}-${d}`,
      custom: { notiz: i % 3 === 0 ? "Teilzeit" : "" },
      availability: randAvail(),
    };
  });
}

/** ==== Persistenz-Keys ==== */
const LS_COLUMNS = "shiftrix.employees.columns.v2";
const LS_ORDER = "shiftrix.employees.order.v2";

/** ==== Builtins (Startzustand) ==== */
const BUILTIN_COLS: ColumnDef[] = [
  { key: "name", label: "Name", visible: true },
  { key: "role", label: "Rolle", visible: true },
  { key: "department", label: "Abteilung", visible: true },
  { key: "status", label: "Status", visible: true },
  { key: "email", label: "E-Mail", visible: false },
  { key: "phone", label: "Telefon", visible: false },
  { key: "hireDate", label: "Eintritt", visible: false },
];

/** ==== Utils ==== */
const isCustom = (k: ColumnKey) => k.startsWith("custom:");
const customId = (k: ColumnKey) => (isCustom(k) ? k.slice(7) : "");
function slugify(v: string) {
  return v.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "").slice(0, 40);
}

/** Block in Tages-Segmente splitten (lokal, mehrtägig) */
function splitBlockByDay(a: Availability): Availability[] {
  const res: Availability[] = [];
  let cur = new Date(a.start);
  const end = new Date(a.end);
  while (startOfDay(cur) <= end) {
    const segStart = cur;
    const segEnd = new Date(Math.min(end.getTime(), endOfDay(cur).getTime()));
    res.push({ start: toLocalISO(segStart), end: toLocalISO(segEnd), type: a.type });
    const next = startOfDay(new Date(cur));
    next.setDate(next.getDate() + 1);
    cur = next;
  }
  return res;
}

/** Schichtfenster für ein Datum nach Policy erzeugen */
function buildShiftWindows(date: Date) {
  const [sh, sm] = ORG_AVAIL_POLICY.shiftStart.split(":").map((n) => parseInt(n, 10));
  const lenMs = ORG_AVAIL_POLICY.shiftLengthHours * 60 * 60 * 1000;
  const list: { label: string; start: Date; end: Date }[] = [];
  for (let i = 0; i < ORG_AVAIL_POLICY.shiftsPerDay; i++) {
    const s = new Date(date);
    s.setHours(sh, sm, 0, 0);
    s.setTime(s.getTime() + i * lenMs);
    const e = new Date(s.getTime() + lenMs);
    const label = ORG_AVAIL_POLICY.shiftsPerDay === 1
      ? "Schicht"
      : i === 0 ? "Früh" : i === 1 ? "Spät" : "Nacht";
    list.push({ label, start: s, end: e });
  }
  return list;
}

/** Aggregation + Segmente für Jahresansicht (lokal) */
function aggregateYearCoverageAndSegments(avails: Availability[], year: number) {
  const first = new Date(year, 0, 1);
  const last = new Date(year, 11, 31, 23, 59, 59, 999);
  const cut = avails.filter((a) => new Date(a.end) >= first && new Date(a.start) <= last);
  const segs = cut.flatMap(splitBlockByDay);

  const coverage = new Map<string, { availMs: number; unavailMs: number }>();
  const segments = new Map<string, Availability[]>();
  for (const s of segs) {
    const ds = new Date(s.start);
    const key = dayKeyLocal(ds);
    const dayStart = startOfDay(ds).getTime();
    const dayEnd = endOfDay(ds).getTime();
    const segStart = Math.max(new Date(s.start).getTime(), dayStart);
    const segEnd = Math.min(new Date(s.end).getTime(), dayEnd);
    const dur = Math.max(0, segEnd - segStart);

    const cur = coverage.get(key) ?? { availMs: 0, unavailMs: 0 };
    if (s.type === "available") cur.availMs += dur; else cur.unavailMs += dur;
    coverage.set(key, cur);

    const list = segments.get(key) ?? [];
    list.push({ ...s, start: toLocalISO(new Date(segStart)), end: toLocalISO(new Date(segEnd)) });
    segments.set(key, list);
  }
  for (const [k, v] of segments) v.sort((a, b) => +new Date(a.start) - +new Date(b.start));
  return { coverage, segments };
}

/** ==== Seite ==== */
export default function EmployeesPage() {
  const router = useRouter();
  const { employees, setAll, add, remove } = useEmployees();

  useEffect(() => {
    if (employees.length === 0) setAll(makeEmployees());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suche / Filter / Pagination
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Spalten (persistiert)
  const [columns, setColumns] = useState<ColumnDef[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const s = localStorage.getItem(LS_COLUMNS);
        if (s) return JSON.parse(s) as ColumnDef[];
      } catch {}
    }
    return BUILTIN_COLS;
  });
  const [order, setOrder] = useState<ColumnKey[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const s = localStorage.getItem(LS_ORDER);
        if (s) return JSON.parse(s) as ColumnKey[];
      } catch {}
    }
    return BUILTIN_COLS.map((c) => c.key);
  });
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(LS_COLUMNS, JSON.stringify(columns));
  }, [columns]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(LS_ORDER, JSON.stringify(order));
  }, [order]);

  const visibleCols = useMemo(
    () => order.map((k) => columns.find((c) => c.key === k)).filter((c): c is ColumnDef => !!c && c.visible),
    [columns, order]
  );

  // gefilterte Daten
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      const hay = [
        e.name,
        e.role,
        e.department,
        e.email ?? "",
        e.phone ?? "",
        e.hireDate ?? "",
        ...Object.values(e.custom ?? {}),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = q ? hay.includes(q) : true;
      const matchesStatus = statusFilter === "alle" ? true : e.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [employees, query, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const rows = filtered.slice(start, end);

  // Modals
  const [openAdd, setOpenAdd] = useState(false);
  const [openAvail, setOpenAvail] = useState<{ emp: Emp } | null>(null);

  return (
    <AdminShell title="Mitarbeiter">
      {/* Filterzeile */}
      <div className="card p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Suchen (alle sichtbaren Spalten + Custom-Felder)"
          className="w-full md:w-80 rounded-brand border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-product-shiftrix/60"
        />

        <div className="flex items-center gap-2">
          <label className="text-sm text-white/70">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="
              rounded-brand border border-white/10 px-3 py-2
              bg-white text-neutral-900
              dark:bg-neutral-900 dark:text-neutral-100
            "
          >
            <option value="alle">Alle</option>
            <option value="aktiv">Aktiv</option>
            <option value="urlaub">Urlaub</option>
            <option value="inaktiv">Inaktiv</option>
          </select>
        </div>

        <ColumnManager
          columns={columns}
          order={order}
          onChangeColumns={setColumns}
          onChangeOrder={setOrder}
        />

        <button onClick={() => setOpenAdd(true)} className="btn btn-primary md:ml-auto">
          + Mitarbeiter
        </button>
      </div>

      {/* Tabelle */}
      <div className="card overflow-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-white/80">
            <tr className="text-left">
              {visibleCols.map((c) => (
                <th key={c.key} className="px-4 py-3">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-white/10 hover:bg-white/5">
                {visibleCols.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.key === "status" ? (
                      <button
                        onClick={() => setOpenAvail({ emp: e })}
                        className={
                          e.status === "aktiv"
                            ? "rounded-full bg-green-500/20 text-green-300 px-2 py-0.5"
                            : e.status === "urlaub"
                            ? "rounded-full bg-yellow-500/20 text-yellow-300 px-2 py-0.5"
                            : "rounded-full bg-white/10 text-white/70 px-2 py-0.5"
                        }
                        title="Verfügbarkeiten anzeigen"
                      >
                        {e.status}
                      </button>
                    ) : (
                      renderCell(e, col.key)
                    )}
                  </td>
                ))}

                {/* Aktionen */}
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      className="rounded-brand border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                      onClick={() => router.push(`/admin/employees/${e.id}`)}
                      title="Bearbeiten"
                      aria-label="Bearbeiten"
                    >
                      ✏️
                    </button>
                    <button
                      className="rounded-brand border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10 text-red-300"
                      onClick={() => {
                        if (confirm(`Mitarbeiter ${e.name} löschen?`)) remove(e.id);
                      }}
                      title="Löschen"
                      aria-label="Löschen"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length + 1} className="px-4 py-8 text-center text-white/60">
                  Keine Treffer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Fußbereich */}
      <div className="flex items-center justify-between text-sm text-white/70">
        <div>
          {filtered.length > 0 ? (
            <span>
              Zeige <strong>{start + 1}</strong>–<strong>{Math.min(end, filtered.length)}</strong> von{" "}
              <strong>{filtered.length}</strong>
            </span>
          ) : (
            <span>0 Ergebnisse</span>
          )}
        </div>
        <Pagination page={currentPage} totalPages={totalPages} onPageChange={(p: number) => setPage(p)} />
      </div>

      {/* Modals */}
      {openAdd && (
        <AddEmployeeModal
          customColumns={columns.filter((c) => c.key.startsWith("custom:"))}
          onClose={() => setOpenAdd(false)}
          onSubmit={(data) => {
            add(data as Omit<Emp, "id">);
            setOpenAdd(false);
            setPage(1);
          }}
        />
      )}

      {openAvail && (
        <AvailabilityModal
          emp={openAvail.emp}
          onClose={() => setOpenAvail(null)}
        />
      )}
    </AdminShell>
  );
}

/** ==== Zellenrenderer ==== */
function renderCell(e: Emp, key: ColumnKey) {
  const customId = (k: ColumnKey) => (k.startsWith("custom:") ? k.slice(7) : "");
  switch (key) {
    case "name":
      return e.name;
    case "role":
      return e.role;
    case "department":
      return e.department;
    case "email":
      return e.email ?? "—";
    case "phone":
      return e.phone ?? "—";
    case "hireDate":
      return e.hireDate ?? "—";
    case "status":
      return e.status; // (wird in der Tabelle als Button gerendert)
    default: {
      const k = customId(key);
      return e.custom?.[k] ?? "—";
    }
  }
}

/** ==== Spalten-Manager ==== */
function ColumnManager({
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

  const isCustomCol = (k: ColumnKey) => k.startsWith("custom:");
  const doSlug = (v: string) => slugify(v);

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
    const id = doSlug(label);
    const key: ColumnKey = `custom:${id}`;
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

/** ==== Modal: Mitarbeiter hinzufügen (Admin) ==== */
function AddEmployeeModal({
  onClose,
  onSubmit,
  customColumns,
}: {
  onClose: () => void;
  onSubmit: (e: Omit<Emp, "id">) => void;
  customColumns: ColumnDef[];
}) {
  const [form, setForm] = useState<Omit<Emp, "id">>({
    name: "",
    role: "",
    department: "",
    status: "aktiv",
    email: "",
    phone: "",
    hireDate: "",
    custom: {},
    availability: [],
  });

  const valid = form.name.trim().length >= 3 && form.role && form.department;

  function handleChange<K extends keyof Omit<Emp, "id">>(key: K, val: Omit<Emp, "id">[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function setCustomField(id: string, val: string) {
    setForm((f) => ({ ...f, custom: { ...(f.custom ?? {}), [id]: val } }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Mitarbeiter hinzufügen</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Name*"
            value={form.name}
            onChange={(v: string) => handleChange("name", v)}
            placeholder="Vorname Nachname"
          />
          <Field
            label="Rolle*"
            value={form.role}
            onChange={(v: string) => handleChange("role", v)}
            placeholder="z. B. Teammitglied"
          />
          <Field
            label="Abteilung*"
            value={form.department}
            onChange={(v: string) => handleChange("department", v)}
            placeholder="z. B. Service"
          />
          <div>
            <label className="block text-xs text-white/60 mb-1">Status (wird in der Handy-App geändert)</label>
            <input
              value={form.status}
              readOnly
              className="w-full rounded-brand border border-white/10 bg-white/10 px-3 py-2 text-white/80"
            />
          </div>
          <Field
            label="E-Mail"
            type="email"
            value={form.email ?? ""}
            onChange={(v: string) => handleChange("email", v)}
            placeholder="name@firma.de"
          />
          <Field
            label="Telefon"
            value={form.phone ?? ""}
            onChange={(v: string) => handleChange("phone", v)}
            placeholder="+49 …"
          />
          <div>
            <label className="block text-xs text-white/60 mb-1">Eintritt</label>
            <input
              value={form.hireDate ?? ""}
              onChange={(e) => handleChange("hireDate", e.target.value)}
              type="date"
              className="w-full rounded-brand border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-product-shiftrix/60"
            />
          </div>

          {customColumns.map((c) => {
            const id = (c.key as string).slice(7);
            return (
              <Field
                key={c.key}
                label={c.label}
                value={(form.custom ?? {})[id] ?? ""}
                onChange={(v: string) => setCustomField(id, v)}
                placeholder={`Wert für ${c.label}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn card border-white/20">
            Abbrechen
          </button>
          <button
            disabled={!valid}
            onClick={() => valid && onSubmit(form)}
            className="btn btn-primary disabled:opacity-50"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

/** ==== Modal: Verfügbarkeit (nur Anzeige, Tag/Schicht/Stunde + Monat/Jahr) ==== */
function AvailabilityModal({ emp, onClose }: { emp: Emp; onClose: () => void }) {
  const [view, setView] = useState<"month" | "year">("month");
  const [gran, setGran] = useState<"day" | "shift" | "hour">(ORG_AVAIL_POLICY.defaultGranularity);
  const [month, setMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // Scroll-Target, wenn aus Jahresansicht geklickt
  const [scrollTargetDay, setScrollTargetDay] = useState<string | null>(null);
  const monthListRef = useRef<HTMLDivElement>(null);

  // Monatsfilter (schneidende Blöcke)
  const monthEntries = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return (emp.availability ?? []).filter((a) => {
      const s = new Date(a.start);
      const e = new Date(a.end);
      return e >= first && s <= last;
    });
  }, [emp.availability, month, year]);

  // Tages-Segmente für Monat
  const segmentsByDay = useMemo(() => {
    const segs = monthEntries.flatMap(splitBlockByDay);
    const map = new Map<string, Availability[]>();
    for (const seg of segs) {
      const key = dayKeyLocal(new Date(seg.start));
      map.set(key, [...(map.get(key) ?? []), seg]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [monthEntries]);

  const monthName = useMemo(
    () => new Intl.DateTimeFormat("de-DE", { month: "long" }).format(new Date(year, month, 1)),
    [month, year]
  );

  // Jahresabdeckung & Segmente (für Balken + Tooltips)
  const { coverage: yearCoverage, segments: yearSegments } = useMemo(
    () => aggregateYearCoverageAndSegments(emp.availability ?? [], year),
    [emp.availability, year]
  );

  // Scroll zu Zieltag nach Sprung
  useEffect(() => {
    if (view !== "month" || !scrollTargetDay) return;
    const el = document.getElementById(`day-${scrollTargetDay}`);
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
    el.classList.add("ring-2", "ring-product-shiftrix/60");
    const t = setTimeout(() => el.classList.remove("ring-2", "ring-product-shiftrix/60"), 1400);
    return () => clearTimeout(t);
  }, [view, segmentsByDay, scrollTargetDay]);

  function tooltipForDay(key: string) {
    const segs = yearSegments.get(key) ?? [];
    if (segs.length === 0) return `${key} — kein Eintrag`;
    const lines = segs.map(s => {
      const t1 = new Date(s.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      const t2 = new Date(s.end).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      return `${t1}–${t2} ${s.type === "available" ? "verfügbar" : "nicht verfügbar"}`;
    });
    return `${key}\n${lines.join("\n")}`;
  }

  function openMonthAndScroll(dayKey: string) {
    const d = new Date(dayKey + "T12:00:00"); // 12:00 gegen DST-Kanten
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setView("month");
    setScrollTargetDay(dayKey);
    setGran("day");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-5xl card p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Verfügbarkeit — {emp.name}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white" aria-label="schließen">
            ✕
          </button>
        </div>

        {/* Ansicht & Raster */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-white/10 p-1">
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 rounded-md text-sm ${view === "month" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`}
            >
              Monat
            </button>
            <button
              onClick={() => setView("year")}
              className={`px-3 py-1.5 rounded-md text-sm ${view === "year" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`}
            >
              Jahr
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-white/10 p-1">
            <button
              onClick={() => setGran("day")}
              className={`px-3 py-1.5 rounded-md text-sm ${gran === "day" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`}
              title="Tagesweise Anzeige"
            >
              Tag
            </button>
            <button
              onClick={() => setGran("shift")}
              className={`px-3 py-1.5 rounded-md text-sm ${gran === "shift" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`}
              title="Schichtanzeige"
            >
              Schicht
            </button>
            <button
              onClick={() => setGran("hour")}
              className={`px-3 py-1.5 rounded-md text-sm ${gran === "hour" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`}
              title="Stundenweise Anzeige"
            >
              Stunde
            </button>
          </div>

          {/* Monat/Jahr Picker */}
          {view === "month" ? (
            <>
              <button
                className="rounded-brand border border-white/10 px-3 py-1.5"
                onClick={() => {
                  const m = month - 1;
                  if (m < 0) {
                    setMonth(11);
                    setYear((y) => y - 1);
                  } else setMonth(m);
                }}
                aria-label="voriger Monat"
              >
                ←
              </button>

              <div className="flex items-center gap-2">
                <select
                  className="rounded-brand border border-white/10 px-3 py-1.5 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Intl.DateTimeFormat("de-DE", { month: "long" }).format(new Date(2000, i, 1))}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  className="w-24 rounded-brand border border-white/10 px-3 py-1.5 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10) || year)}
                />
              </div>

              <button
                className="rounded-brand border border-white/10 px-3 py-1.5"
                onClick={() => {
                  const m = month + 1;
                  if (m > 11) {
                    setMonth(0);
                    setYear((y) => y + 1);
                  } else setMonth(m);
                }}
                aria-label="nächster Monat"
              >
                →
              </button>

              <div className="ml-auto text-sm text-white/70 capitalize">
                {monthName} {year}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-brand border border-white/10 px-3 py-1.5"
                  onClick={() => setYear((y) => y - 1)}
                  aria-label="voriges Jahr"
                >
                  ←
                </button>
                <input
                  type="number"
                  className="w-28 rounded-brand border border-white/10 px-3 py-1.5 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10) || year)}
                />
                <button
                  className="rounded-brand border border-white/10 px-3 py-1.5"
                  onClick={() => setYear((y) => y + 1)}
                  aria-label="nächstes Jahr"
                >
                  →
                </button>
              </div>
              <div className="ml-auto text-sm text-white/70">{year}</div>
            </>
          )}
        </div>

        {/* Inhalt */}
        {view === "month" ? (
          <>
            <div ref={monthListRef} className="space-y-2 max-h-[58vh] overflow-auto pr-1">
              {segmentsByDay.length === 0 && <div className="text-white/60">Keine Einträge in diesem Monat.</div>}

              {segmentsByDay.map(([day, list]) => {
                const dayDate = new Date(day + "T00:00:00");
                return (
                  <div id={`day-${day}`} key={day} className="rounded-brand border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">
                        {dayDate.toLocaleDateString("de-DE", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                      {gran === "shift" && ORG_AVAIL_POLICY.shiftsPerDay > 1 && (
                        <div className="text-xs text-white/60">
                          {ORG_AVAIL_POLICY.shiftsPerDay}×{ORG_AVAIL_POLICY.shiftLengthHours}h ab {ORG_AVAIL_POLICY.shiftStart}
                        </div>
                      )}
                    </div>

                    {gran === "day" && <DayRow blocks={list} />}

                    {gran === "hour" && (
                      <div className="flex flex-col gap-1">
                        {list
                          .sort((a, b) => +new Date(a.start) - +new Date(b.start))
                          .map((a, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className={a.type === "available" ? "text-emerald-300" : "text-rose-300"}>
                                {a.type === "available" ? "Verfügbar" : "Nicht verfügbar"}
                              </span>
                              <span className="text-white/80">
                                {new Date(a.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} –{" "}
                                {new Date(a.end).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}

                    {gran === "shift" && <ShiftRow dayDate={dayDate} blocks={list} />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-white/60">
              <div className="flex items-center gap-4">
                <span><span className="inline-block h-2 w-2 rounded bg-emerald-500 mr-2" />verfügbar</span>
                <span><span className="inline-block h-2 w-2 rounded bg-rose-500 mr-2" />nicht verfügbar</span>
              </div>
              <span>Verfügbarkeiten werden in der <b>Handy-App</b> vom/von der Mitarbeiter:in gepflegt.</span>
            </div>
          </>
        ) : (
          <>
            <YearOverviewBars
              year={year}
              coverage={yearCoverage}
              getTooltip={tooltipForDay}
              onDayClick={openMonthAndScroll}
            />
            <div className="flex items-center gap-4 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-3 rounded bg-emerald-500" /> Anteil verfügbar
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-3 rounded bg-rose-500" /> Anteil nicht verfügbar
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-3 rounded bg-neutral-400" /> ohne Eintrag
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Tageszeile (Tag-Raster) */
function DayRow({ blocks }: { blocks: Availability[] }) {
  // ganzer Tag?
  const coversFullDay = (() => {
    const min = Math.min(...blocks.map(b => +new Date(b.start)));
    const max = Math.max(...blocks.map(b => +new Date(b.end)));
    const s = new Date(min); const e = new Date(max);
    const fullStart = new Date(s); fullStart.setHours(0,0,0,0);
    const fullEnd = new Date(s); fullEnd.setHours(23,59,59,999);
    return +startOfDay(s) === +fullStart && +e >= +fullEnd;
  })();

  if (coversFullDay) {
    const hasUnavailable = blocks.some(b => b.type === "unavailable");
    return (
      <div className={`px-3 py-2 rounded-brand text-sm inline-flex items-center gap-2
        ${hasUnavailable ? "bg-rose-500/15 text-rose-200" : "bg-emerald-500/15 text-emerald-200"}`}>
        {hasUnavailable ? "Nicht verfügbar (ganzer Tag)" : "Verfügbar (ganzer Tag)"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {blocks
        .sort((a, b) => +new Date(a.start) - +new Date(b.start))
        .map((a, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className={a.type === "available" ? "text-emerald-300" : "text-rose-300"}>
              {a.type === "available" ? "Verfügbar" : "Nicht verfügbar"}
            </span>
            <span className="text-white/80">
              {new Date(a.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} –{" "}
              {new Date(a.end).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
    </div>
  );
}

/** Schichtzeile (Schicht-Raster) */
function ShiftRow({ dayDate, blocks }: { dayDate: Date; blocks: Availability[] }) {
  const shifts = buildShiftWindows(dayDate);
  function classify(s: {start: Date; end: Date}) {
    let state: "none" | "available" | "unavailable" = "none";
    for (const b of blocks) {
      const bs = new Date(b.start); const be = new Date(b.end);
      const overlaps = be > s.start && bs < s.end;
      if (overlaps) {
        if (b.type === "unavailable") return "unavailable";
        state = "available";
      }
    }
    return state;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {shifts.map((w, idx) => {
        const st = classify(w);
        const cls =
          st === "available"   ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" :
          st === "unavailable" ? "bg-rose-500/15 text-rose-200 border-rose-500/30" :
                                 "bg-white/5 text-white/60 border-white/15";
        return (
          <div key={idx} className={`px-3 py-1.5 rounded-brand border text-sm`}>
            <span className="mr-2 opacity-80">{w.label}</span>
            <span className={`inline-block ${cls} rounded-md px-2 py-0.5`}>
              {w.start.toLocaleTimeString("de-DE",{hour:"2-digit", minute:"2-digit"})}–{w.end.toLocaleTimeString("de-DE",{hour:"2-digit", minute:"2-digit"})}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Jahresübersicht mit Wochentag + Datum + breiten klickbaren Balken (gestapelt) */
function YearOverviewBars({
  year,
  coverage,
  getTooltip,
  onDayClick,
}: {
  year: number;
  coverage: Map<string, { availMs: number; unavailMs: number }>;
  getTooltip: (dayKey: string) => string;
  onDayClick: (dayKey: string) => void;
}) {
  const MONTH_LABELS = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[58vh] overflow-auto pr-1">
      {Array.from({ length: 12 }).map((_, mi) => {
        const daysInMonth = new Date(year, mi + 1, 0).getDate();

        const rows = Array.from({ length: daysInMonth }).map((__, di) => {
          const d = new Date(year, mi, di + 1);
          const key = dayKeyLocal(d);
          const cov = coverage.get(key) ?? { availMs: 0, unavailMs: 0 };
          const availPct = clamp01(cov.availMs / DAY_MS);
          const unavailPct = clamp01(cov.unavailMs / DAY_MS);

          const weekday = d.toLocaleDateString("de-DE", { weekday: "short" });
          const dayNum  = d.toLocaleDateString("de-DE", { day: "2-digit" });

          return (
            <button
              key={key}
              onClick={() => onDayClick(key)}
              title={getTooltip(key)}
              className="grid grid-cols-[64px,1fr] items-center gap-1 text-left group"
            >
              {/* kleineres Label */}
              <div className="text-[11px] leading-4 text-white/70 tabular-nums">
                {weekday} {dayNum}.
              </div>

              {/* breiter Balken, näher am Label */}
              <div className="flex w-full h-2 rounded overflow-hidden bg-neutral-300/50 dark:bg-neutral-700/60 ring-0 group-hover:ring-2 group-hover:ring-white/30 transition">
                {/* verfügbar */}
                <div
                  className="h-full bg-emerald-500"
                  style={{ flexBasis: `${availPct * 100}%` }}
                />
                {/* nicht verfügbar */}
                <div
                  className="h-full bg-rose-500"
                  style={{ flexBasis: `${unavailPct * 100}%` }}
                />
                {/* Rest bleibt Hintergrundfarbe */}
              </div>
            </button>
          );
        });

        return (
          <div key={mi} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-2 font-medium">{MONTH_LABELS[mi]}</div>
            <div className="flex flex-col gap-1.5">
              {rows}
            </div>
          </div>
        );
      })}
    </div>
  );
}


/** ==== Kleinzeug ==== */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
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
