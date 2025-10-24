"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Employee as Emp, Availability } from "../../../store/employees";
import { aggregateYearCoverageAndSegments, dayKeyLocal } from "./helpers";

type Policy = {
  defaultGranularity: "day" | "shift" | "hour";
  shiftStart: string;        // "08:00"
  shiftLengthHours: number;  // 8
  shiftsPerDay: number;      // 1..3
};

export default function AvailabilityModal({
  emp,
  policy,
  onClose,
  children,
}: {
  emp: Emp;
  policy: Policy;
  onClose: () => void;
  children?: (args: {
    year: number;
    coverage: Map<string, { availMs: number; unavailMs: number }>;
    getTooltip: (dayKey: string) => string;
    onDayClick: (dayKey: string) => void;
  }) => React.ReactNode;
}) {
  const [view, setView] = useState<"month" | "year">("month");
  const [gran, setGran] = useState<"day" | "shift" | "hour">(policy.defaultGranularity);
  const [month, setMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [scrollTargetDay, setScrollTargetDay] = useState<string | null>(null);
  const monthListRef = useRef<HTMLDivElement>(null);

  /** helpers (lokal) **/
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const toLocalISO = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3,"0")}`;
  function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
  function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }

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

  function buildShiftWindows(date: Date) {
    const [sh, sm] = policy.shiftStart.split(":").map((n) => parseInt(n, 10));
    const lenMs = policy.shiftLengthHours * 60 * 60 * 1000;
    const list: { label: string; start: Date; end: Date }[] = [];
    for (let i = 0; i < policy.shiftsPerDay; i++) {
      const s = new Date(date);
      s.setHours(sh, sm, 0, 0);
      s.setTime(s.getTime() + i * lenMs);
      const e = new Date(s.getTime() + lenMs);
      const label = policy.shiftsPerDay === 1 ? "Schicht" : i === 0 ? "Früh" : i === 1 ? "Spät" : "Nacht";
      list.push({ label, start: s, end: e });
    }
    return list;
  }

  // Monatsfilter (schneidende Blöcke)
  const monthEntries = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return (emp.availability ?? []).filter((a) => {
      const s = new Date(a.start); const e = new Date(a.end);
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
    const d = new Date(dayKey + "T12:00:00");
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
          <button onClick={onClose} className="text-white/70 hover:text-white" aria-label="schließen">✕</button>
        </div>

        {/* Ansicht & Raster */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-white/10 p-1">
            <button onClick={() => setView("month")}
              className={`px-3 py-1.5 rounded-md text-sm ${view === "month" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`}>
              Monat
            </button>
            <button onClick={() => setView("year")}
              className={`px-3 py-1.5 rounded-md text-sm ${view === "year" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`}>
              Jahr
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-white/10 p-1">
            <button onClick={() => setGran("day")}
              className={`px-3 py-1.5 rounded-md text-sm ${gran === "day" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`} title="Tagesweise Anzeige">
              Tag
            </button>
            <button onClick={() => setGran("shift")}
              className={`px-3 py-1.5 rounded-md text-sm ${gran === "shift" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`} title="Schichtanzeige">
              Schicht
            </button>
            <button onClick={() => setGran("hour")}
              className={`px-3 py-1.5 rounded-md text-sm ${gran === "hour" ? "bg-white text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900" : "text-white/80"}`} title="Stundenweise Anzeige">
              Stunde
            </button>
          </div>

          {/* Monat/Jahr Picker */}
          {view === "month" ? (
            <>
              <button className="rounded-brand border border-white/10 px-3 py-1.5"
                onClick={() => { const m = month - 1; if (m < 0) { setMonth(11); setYear((y) => y - 1); } else setMonth(m); }}
                aria-label="voriger Monat">←</button>

              <div className="flex items-center gap-2">
                <select className="rounded-brand border border-white/10 px-3 py-1.5 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                  value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>{new Intl.DateTimeFormat("de-DE", { month: "long" }).format(new Date(2000, i, 1))}</option>
                  ))}
                </select>
                <input type="number" className="w-24 rounded-brand border border-white/10 px-3 py-1.5 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                  value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || year)} />
              </div>

              <button className="rounded-brand border border-white/10 px-3 py-1.5"
                onClick={() => { const m = month + 1; if (m > 11) { setMonth(0); setYear((y) => y + 1); } else setMonth(m); }}
                aria-label="nächster Monat">→</button>

              <div className="ml-auto text-sm text-white/70 capitalize">
                {new Intl.DateTimeFormat("de-DE", { month: "long" }).format(new Date(year, month, 1))} {year}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button className="rounded-brand border border-white/10 px-3 py-1.5" onClick={() => setYear((y) => y - 1)} aria-label="voriges Jahr">←</button>
                <input type="number" className="w-28 rounded-brand border border-white/10 px-3 py-1.5 bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100"
                  value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || year)} />
                <button className="rounded-brand border border-white/10 px-3 py-1.5" onClick={() => setYear((y) => y + 1)} aria-label="nächstes Jahr">→</button>
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
                        {dayDate.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                      </div>
                      {gran === "shift" && policy.shiftsPerDay > 1 && (
                        <div className="text-xs text-white/60">{policy.shiftsPerDay}×{policy.shiftLengthHours}h ab {policy.shiftStart}</div>
                      )}
                    </div>

                    {gran === "day"   && <DayRow blocks={list} />}
                    {gran === "hour"  && <HourList blocks={list} />}
                    {gran === "shift" && <ShiftRow dayDate={dayDate} blocks={list} buildShiftWindows={buildShiftWindows} />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-white/60">
              <div className="flex items-center gap-4">
                <span><span className="inline-block h-2 w-2 rounded bg-emerald-500 mr-2" />verfügbar</span>
                <span><span className="inline-block h-2 w-2 rounded bg-rose-500 mr-2" />nicht verfügbar</span>
              </div>
              <span>Verfügbarkeiten werden in der <b>Handy-App</b> gepflegt.</span>
            </div>
          </>
        ) : (
          <>
            {children?.({
              year,
              coverage: yearCoverage,
              getTooltip: tooltipForDay,
              onDayClick: openMonthAndScroll,
            })}
          </>
        )}
      </div>
    </div>
  );
}

/** Tageszeile (Tag-Raster) */
function DayRow({ blocks }: { blocks: Availability[] }) {
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const endOfDay   = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
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

function HourList({ blocks }: { blocks: Availability[] }) {
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
function ShiftRow({
  dayDate,
  blocks,
  buildShiftWindows,
}: {
  dayDate: Date;
  blocks: Availability[];
  buildShiftWindows: (d: Date) => {label: string; start: Date; end: Date}[];
}) {
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
      {buildShiftWindows(dayDate).map((w, idx) => {
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
