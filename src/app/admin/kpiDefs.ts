// src/app/admin/kpiDefs.ts
export const KPI_OPTIONS = [
  { key: "kpi:heute",             label: "Heute" },
  { key: "kpi:offene-schichten",  label: "Offene Schichten" },
  { key: "kpi:genehmigungen",     label: "Genehmigungen" },
  { key: "kpi:auslastung",        label: "Auslastung" },
  { key: "kpi:urlaub",            label: "Urlaub" },
] as const;

export type KpiOption = typeof KPI_OPTIONS[number];
export type KpiKey = KpiOption["key"];

// Optional: schneller Lookup
const KPI_LABEL_MAP = new Map<string, string>(
  KPI_OPTIONS.map(o => [o.key, o.label])
);

export function kpiLabelFor(key: string): string {
  return KPI_LABEL_MAP.get(key) ?? key;
}
