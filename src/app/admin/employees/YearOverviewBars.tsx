"use client";

import React from "react";
import { clamp01, dayKeyLocal, DAY_MS } from "./helpers";

export default function YearOverviewBars({
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
              <div className="text-[11px] leading-4 text-white/70 tabular-nums">
                {weekday} {dayNum}.
              </div>
              <div className="flex w-full h-2 rounded overflow-hidden bg-neutral-300/50 dark:bg-neutral-700/60 ring-0 group-hover:ring-2 group-hover:ring-white/30 transition">
                <div className="h-full bg-emerald-500" style={{ flexBasis: `${availPct * 100}%` }} />
                <div className="h-full bg-rose-500" style={{ flexBasis: `${unavailPct * 100}%` }} />
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
