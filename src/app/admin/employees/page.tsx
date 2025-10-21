"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../../../components/AdminShell";
import { Pagination } from "../../../components/Pagination";
// --- Typen ---
type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "aktiv" | "inaktiv" | "urlaub";
};

// --- Dummy-Daten (generatorisch) ---
const FIRST = ["Alex", "Sam", "Mila", "Jonas", "Lea", "Paul", "Nora", "Tom", "Eva", "Jan", "Sara", "Luca", "Marek", "Aylin", "Ben"];
const LAST  = ["Schmidt", "Meyer", "Fischer", "Weber", "Wagner", "Becker", "Hoffmann", "Klein", "Wolf", "Neumann", "Schwarz", "Braun"];
const ROLES = ["Schichtleiter:in", "Teammitglied", "Dispo", "HR", "Backoffice", "Technik"];
const DEPTS = ["Lager", "Kasse", "Service", "Produktion", "Bühne", "Logistik"];
const STATS: Employee["status"][] = ["aktiv", "inaktiv", "urlaub"];

function makeEmployees(n = 87): Employee[] {
  return Array.from({ length: n }).map((_, i) => {
    const f = FIRST[i % FIRST.length];
    const l = LAST[i % LAST.length];
    return {
      id: String(i + 1).padStart(3, "0"),
      name: `${f} ${l}`,
      role: ROLES[i % ROLES.length],
      department: DEPTS[(i * 2) % DEPTS.length],
      status: STATS[(i * 3) % STATS.length],
    };
  });
}

const ALL_EMPLOYEES = makeEmployees();

export default function EmployeesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter + Suche
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_EMPLOYEES.filter((e) => {
      const matchesQuery = q
        ? [e.name, e.role, e.department].some((v) => v.toLowerCase().includes(q))
        : true;
      const matchesStatus = statusFilter === "alle" ? true : e.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const rows = filtered.slice(start, end);

  // Wenn Filter/Suche/Seitengröße sich ändern → auf Seite 1 springen
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, pageSize]);

  return (
    <AdminShell title="Mitarbeiter">
      {/* Filterzeile */}
      <div className="card p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen (Name, Rolle, Abteilung)"
          className="w-full md:w-80 rounded-brand border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-product-shiftrix/60"
        />

        <div className="flex items-center gap-2">
          <label className="text-sm text-white/70">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-brand border border-white/10 bg-white/5 px-3 py-2"
          >
            <option value="alle">Alle</option>
            <option value="aktiv">Aktiv</option>
            <option value="urlaub">Urlaub</option>
            <option value="inaktiv">Inaktiv</option>
          </select>
        </div>

        <div className="flex items-center gap-2 md:ml-auto">
          <label className="text-sm text-white/70">Pro Seite</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            className="rounded-brand border border-white/10 bg-white/5 px-3 py-2"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabelle */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/80">
            <tr className="text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Rolle</th>
              <th className="px-4 py-3">Abteilung</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-3">{e.name}</td>
                <td className="px-4 py-3">{e.role}</td>
                <td className="px-4 py-3">{e.department}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      e.status === "aktiv"
                        ? "rounded-full bg-green-500/20 text-green-300 px-2 py-0.5"
                        : e.status === "urlaub"
                        ? "rounded-full bg-yellow-500/20 text-yellow-300 px-2 py-0.5"
                        : "rounded-full bg-white/10 text-white/70 px-2 py-0.5"
                    }
                  >
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="btn btn-primary text-xs">Öffnen</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/60">
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
              Zeige <strong>{start + 1}</strong>–<strong>{Math.min(end, filtered.length)}</strong> von <strong>{filtered.length}</strong>
            </span>
          ) : (
            <span>0 Ergebnisse</span>
          )}
        </div>
        <Pagination
  page={currentPage}
  totalPages={totalPages}
  onPageChange={(p: number) => setPage(p)}
        />
      </div>
    </AdminShell>
  );
}
