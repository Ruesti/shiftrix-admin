"use client";
import React from "react";

export function Pagination({
  page, totalPages, onPageChange,
}: { page: number; totalPages: number; onPageChange: (p: number) => void; }) {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  const btn = "rounded-brand border border-white/10 bg-white/5 px-3 py-1.5 text-sm disabled:opacity-40";

  const windowSize = 1;
  const start = Math.max(1, page - windowSize);
  const end = Math.min(totalPages, page + windowSize);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="flex items-center gap-2">
      <button className={btn} onClick={() => onPageChange(1)} disabled={!canPrev}>«</button>
      <button className={btn} onClick={() => onPageChange(page - 1)} disabled={!canPrev}>Zurück</button>
      {start > 1 && <span className="px-1">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? `${btn} !bg-product-shiftrix !text-white` : btn}
          onClick={() => onPageChange(p)}
        >{p}</button>
      ))}
      {end < totalPages && <span className="px-1">…</span>}
      <button className={btn} onClick={() => onPageChange(page + 1)} disabled={!canNext}>Weiter</button>
      <button className={btn} onClick={() => onPageChange(totalPages)} disabled={!canNext}>»</button>
    </div>
  );
}
