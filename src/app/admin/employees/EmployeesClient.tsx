"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "../../../components/AdminShell";
import { Pagination } from "../../../components/Pagination";
import { useEmployees, type Employee as Emp, type Availability } from "../../../store/employees";

import ColumnManager from "./ColumnManager";
import AddEmployeeModal from "./AddEmployeeModal";
import AvailabilityModal from "./AvailabilityModal";
import YearOverviewBars from "./YearOverviewBars";
import { aggregateYearCoverageAndSegments, dayKeyLocal, clamp01, DAY_MS } from "./helpers";

/** ==== Organisationsweite Anzeige-Policy (nur Visualisierung) ==== */
const ORG_AVAIL_POLICY = {
  defaultGranularity: "day" as "day" | "shift" | "hour",
  shiftStart: "08:00",
  shiftLengthHours: 8,
  shiftsPerDay: 1,
};

/** ==== Typen ==== */
type BuiltinKey = "name" | "role" | "department" | "status" | "email" | "phone" | "hireDate";
export type ColumnKey = BuiltinKey | `custom:${string}`;
export type ColumnDef = { key: ColumnKey; label: string; visible: boolean };

/** ==== Dummy-Daten (Initial) ==== */
const FIRST = ["Alex", "Sam", "Mila", "Jonas", "Lea", "Paul", "Nora", "Tom", "Eva", "Jan", "Sara", "Luca", "Marek", "Aylin", "Ben"];
const LAST  = ["Schmidt", "Meyer", "Fischer", "Weber", "Wagner", "Becker", "Hoffmann", "Klein", "Wolf", "Neumann", "Schwarz", "Braun"];
const ROLES = ["Schichtleiter:in", "Teammitglied", "Dispo", "HR", "Backoffice", "Technik"];
const DEPTS = ["Lager", "Kasse", "Service", "Produktion", "Bühne", "Logistik"];
const STATS: Emp["status"][] = ["aktiv", "inaktiv", "urlaub"];

const pad2 = (n: number) => String(n).padStart(2, "0");
const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3,"0")}`;

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }

/** Dummy-Verfügbarkeiten (lokale Zeiten ohne 'Z') */
function randAvail(): Availability[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const iso = (Y: number, M: number, D: number, hh = 9, mm = 0) =>
    `${Y}-${pad2(M + 1)}-${pad2(D)}T${pad2(hh)}:${pad2(mm)}:00.000`;
  return [
    { start: iso(y, m, 2, 0, 0),  end: iso(y, m, 2, 23, 59), type: "available" },
    { start: iso(y, m, 6, 8, 0),  end: iso(y, m, 6, 16, 0),  type: "available" },
    { start: iso(y, m, 10,10, 0), end: iso(y, m, 10,12, 0), type: "unavailable" },
    { start: iso(y, m, 12,22, 0), end: iso(y, m, 13, 6, 0), type: "available" },
    { start: iso(y, m, 15, 0, 0), end: iso(y, m, 17,23,59), type: "unavailable" },
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

/** ==== Seite (Client) ==== */
export default function EmployeesClient() {
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
            className="rounded-brand border border-white/10 px-3 py-2 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
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
          customColumns={columns.filter((c) => (c.key as string).startsWith("custom:"))}
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
          policy={ORG_AVAIL_POLICY}
          onClose={() => setOpenAvail(null)}
        >
          {({ year, coverage, getTooltip, onDayClick }) => (
            <>
              <YearOverviewBars
                year={year}
                coverage={coverage}
                getTooltip={getTooltip}
                onDayClick={onDayClick}
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
        </AvailabilityModal>
      )}
    </AdminShell>
  );
}

/** ==== Zellenrenderer ==== */
function renderCell(e: Emp, key: ColumnKey) {
  const customId = (k: ColumnKey) => (k.startsWith("custom:") ? k.slice(7) : "");
  switch (key) {
    case "name": return e.name;
    case "role": return e.role;
    case "department": return e.department;
    case "email": return e.email ?? "—";
    case "phone": return e.phone ?? "—";
    case "hireDate": return e.hireDate ?? "—";
    case "status": return e.status;
    default: {
      const k = customId(key);
      return e.custom?.[k] ?? "—";
    }
  }
}
