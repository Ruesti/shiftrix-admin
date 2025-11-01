// src/app/admin/employees/VisibleCount.tsx
"use client";

export default function VisibleCount({ count }: { count: number }) {
  return <span className="text-xs text-white/60">{count} sichtbar</span>;
}
