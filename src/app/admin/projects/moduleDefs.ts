// src/app/admin/projects/moduleDefs.ts

// Alle möglichen Module, die ein Projekt haben kann
export type ModuleKey =
  | "shiftplan"
  | "availability"
  | "time_tracking"
  | "vacation"
  | "tasks"
  | "comms"
  | "reports"
  | "locations";

// Modul-Definition mit Label & Beschreibung
export interface ModuleDef {
  key: ModuleKey;
  label: string;
  description: string;
  icon?: string; // optional: später für UI
}

// Liste der verfügbaren Module im Baukastensystem
export const MODULE_OPTIONS: ModuleDef[] = [
  {
    key: "shiftplan",
    label: "Schichtplan",
    description:
      "Planung und Zuweisung von Schichten für Teams oder Einzelpersonen.",
  },
  {
    key: "availability",
    label: "Verfügbarkeit",
    description:
      "Mitarbeiter können ihre Verfügbarkeit angeben oder Abwesenheiten eintragen.",
  },
  {
    key: "time_tracking",
    label: "Zeiterfassung",
    description:
      "Arbeitszeiten erfassen, Pausen dokumentieren und Auswertungen erstellen.",
  },
  {
    key: "vacation",
    label: "Urlaubsplanung",
    description:
      "Urlaubsanträge stellen und genehmigen. Übersicht über Resturlaub.",
  },
  {
    key: "tasks",
    label: "Aufgaben",
    description:
      "Projektaufgaben anlegen, zuweisen und Fortschritt verfolgen.",
  },
  {
    key: "comms",
    label: "Kommunikation",
    description:
      "Chat, Kommentare und interne Kommunikation innerhalb des Projekts.",
  },
  {
    key: "reports",
    label: "Berichte",
    description:
      "Datenexporte, Auswertungen und Statistiken zu Projekten und Mitarbeitern.",
  },
  {
    key: "locations",
    label: "Standorte",
    description:
      "Verwaltung mehrerer Einsatzorte oder Filialen, optional mit Kartenintegration.",
  },
];

// Struktur eines Datensatzes aus Supabase (projects)
export interface ProjectRow {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  modules: ModuleKey[];
  settings: Record<string, any>;
}
