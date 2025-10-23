// src/app/admin/projects/modules.ts
export const MODULE_OPTIONS = [
  { key: "shiftplan", label: "Schichtplan" },
  { key: "availability", label: "Verfügbarkeit" },
  { key: "vacation", label: "Urlaubsplaner" },
  { key: "time_tracking", label: "Zeiterfassung" },
  { key: "tasks", label: "Projektaufgaben" },
  { key: "comms", label: "Kommunikation" },
  { key: "reports", label: "Berichte & Export" },
  { key: "locations", label: "Standortplanung" },
] as const;

export type ModuleKey = typeof MODULE_OPTIONS[number]["key"];

export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  modules: ModuleKey[] | null;
  settings: Record<string, any> | null;
};
