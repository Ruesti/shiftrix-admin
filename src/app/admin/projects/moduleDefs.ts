// src/app/admin/projects/moduleDefs.ts
export type ModuleKey =
  | "kpi_overview"          // Admin
  | "kpi_approvals"         // Admin
  | "kpi_time_anomalies"    // Admin
  | "kpi_shift_coverage"    // Admin
  | "shiftplan"             // Fach
  | "availability"          // Fach
  | "time_tracking"         // Fach
  | "vacation"              // Fach
  | "tasks"                 // Fach
  | "comms"                 // Fach
  | "reports"               // Fach
  | "locations";            // Fach

export type ModuleArea = "admin" | "project" | "people" | "ops";

export const MODULE_OPTIONS: Array<{
  key: ModuleKey;
  label: string;
  description?: string;
  area: ModuleArea;
}> = [
  // ---- Admin-KPI-Module (nur auf / zeigen) ----
  { key: "kpi_overview",       label: "Übersicht",            description: "Kennzahlen auf einen Blick",              area: "admin" },
  { key: "kpi_approvals",      label: "Offene Genehmigungen", description: "Urlaub/Zeiten zur Freigabe",              area: "admin" },
  { key: "kpi_time_anomalies", label: "Zeit-Abweichungen",    description: "Fehlende/auffällige Buchungen",          area: "admin" },
  { key: "kpi_shift_coverage", label: "Schichtabdeckung",     description: "Besetzungsgrad über Projekte",           area: "admin" },

  // ---- Fachmodule (nicht auf / anzeigen) ----
  { key: "shiftplan",      label: "Schichtplan",    area: "project" },
  { key: "availability",   label: "Verfügbarkeit",  area: "people"  },
  { key: "time_tracking",  label: "Zeiterfassung",  area: "people"  },
  { key: "vacation",       label: "Urlaub",         area: "people"  },
  { key: "tasks",          label: "Aufgaben",       area: "project" },
  { key: "comms",          label: "Kommunikation",  area: "project" },
  { key: "reports",        label: "Berichte",       area: "ops"     },
  { key: "locations",      label: "Standorte",      area: "project" },
];
