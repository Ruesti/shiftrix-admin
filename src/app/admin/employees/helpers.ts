export const DAY_MS = 24 * 60 * 60 * 1000;

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const pad2 = (n: number) => String(n).padStart(2, "0");

export function dayKeyLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function aggregateYearCoverageAndSegments(avails: {start: string; end: string; type: "available"|"unavailable"}[], year: number) {
  const first = new Date(year, 0, 1);
  const last = new Date(year, 11, 31, 23, 59, 59, 999);

  const cut = avails.filter((a) => new Date(a.end) >= first && new Date(a.start) <= last);

  const segments = new Map<string, typeof avails>();
  const coverage = new Map<string, { availMs: number; unavailMs: number }>();

  for (const s of cut) {
    const ds = new Date(s.start);
    const key = dayKeyLocal(ds);
    const dur = Math.max(0, new Date(s.end).getTime() - new Date(s.start).getTime());
    const cur = coverage.get(key) ?? { availMs: 0, unavailMs: 0 };
    if (s.type === "available") cur.availMs += dur;
    else cur.unavailMs += dur;
    coverage.set(key, cur);

    const list = segments.get(key) ?? [];
    list.push(s as any);
    segments.set(key, list);
  }
  return { coverage, segments };
}
