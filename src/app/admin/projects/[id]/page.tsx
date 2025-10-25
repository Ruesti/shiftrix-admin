export const dynamic    = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime    = "nodejs";

// src/app/admin/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchProjects, fetchProjectById } from "../actions.server"; // bzw. "./actions.server"

import { MODULE_OPTIONS, type ModuleKey } from "../moduleDefs";
import Tabs from "./Tabs";
import SettingsPanelClient from "./SettingsPanelClient";

// Label-Map, um Typ-Fehler im .find() zu vermeiden
const MODULE_LABELS = Object.fromEntries(
  MODULE_OPTIONS.map((o) => [o.key, o.label] as const)
) as Record<ModuleKey, string>;

// WICHTIG: Beide als Promise typisieren
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  // beide Props auflösen (parallel)
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const tab = q?.tab;

  const project = await fetchProjectById(id);
  if (!project) notFound();

  const activeModules = (project.modules ?? []) as ModuleKey[];

  const tabs: { key: string; label: string }[] = [
    { key: "overview", label: "Übersicht" },
    ...activeModules.map((k) => ({ key: k, label: MODULE_LABELS[k] ?? k })),
    { key: "settings", label: "Einstellungen" },
  ];

  const current =
    tabs.find((t) => t.key === (tab || ""))?.key ??
    (activeModules[0] || "overview");

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/projects"
              className="text-sm text-white/70 hover:text-white/90 underline underline-offset-4"
            >
              ← Zurück zu Projekte
            </Link>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-white/70 mt-1">{project.description}</p>
          )}
          <p className="text-xs text-white/50 mt-2">
            Angelegt am{" "}
            {new Date(project.created_at).toLocaleDateString("de-DE")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs projectId={project.id} tabs={tabs} />

      {/* Panel */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        {current === "overview" && (
          <OverviewPanel
            projectId={project.id}
            modules={activeModules}
            settings={project.settings || {}}
          />
        )}

        {current === "settings" && (
          <SettingsPanelClient
            projectId={project.id}
            initialSettings={project.settings || {}}
          />
        )}

        {activeModules.includes("availability") &&
          current === "availability" && (
            <AvailabilityPanel projectId={project.id} />
          )}

        {activeModules.includes("shiftplan") && current === "shiftplan" && (
          <ShiftplanPanel projectId={project.id} />
        )}

        {activeModules.includes("time_tracking") &&
          current === "time_tracking" && (
            <TimeTrackingPanel projectId={project.id} />
          )}

        {activeModules.includes("vacation") && current === "vacation" && (
          <VacationPanel projectId={project.id} />
        )}

        {activeModules.includes("tasks") && current === "tasks" && (
          <TasksPanel projectId={project.id} />
        )}

        {activeModules.includes("comms") && current === "comms" && (
          <CommsPanel projectId={project.id} />
        )}

        {activeModules.includes("reports") && current === "reports" && (
          <ReportsPanel projectId={project.id} />
        )}

        {activeModules.includes("locations") && current === "locations" && (
          <LocationsPanel projectId={project.id} />
        )}
      </div>
    </section>
  );
}

/* ---------- Panels (Serverkomponenten / Platzhalter) ---------- */

import type { ModuleKey as _MK } from "../moduleDefs"; // nur um TS ruhig zu halten

function OverviewPanel(props: {
  projectId: string;
  modules: ModuleKey[];
  settings: Record<string, any>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Projekt-Übersicht</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-xs text-white/60">Projekt-ID</p>
          <p className="font-mono text-sm break-all">{props.projectId}</p>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-xs text-white/60">Aktive Module</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {props.modules.length ? (
              props.modules.map((m) => (
                <span
                  key={m}
                  className="text-xs rounded-md border border-white/15 bg-black/30 px-2 py-1"
                >
                  {m}
                </span>
              ))
            ) : (
              <span className="text-sm text-white/60">Kein Modul aktiv</span>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-xs text-white/60">Zeitzone</p>
          <p className="text-sm">{props.settings?.timezone ?? "—"}</p>
          <p className="text-xs text-white/60 mt-2">Arbeitstag</p>
          <p className="text-sm">
            {props.settings?.workday?.start ?? "—"} –{" "}
            {props.settings?.workday?.end ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function AvailabilityPanel({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Verfügbarkeit</h2>
      <p className="text-sm text-white/70">
        Hier können Mitarbeiter künftig ihre Verfügbarkeiten eintragen.{"  "}
        Nächster Schritt: Tabelle <code>availability</code> mit{" "}
        <code>project_id</code>.
      </p>
    </div>
  );
}

function ShiftplanPanel({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Schichtplan</h2>
      <p className="text-sm text-white/70">
        Planung und Zuweisung von Schichten.{"  "}
        Nächster Schritt: Tabelle <code>shifts</code> mit{" "}
        <code>project_id</code>.
      </p>
    </div>
  );
}

function TimeTrackingPanel({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Zeiterfassung</h2>
      <p className="text-sm text-white/70">
        Manuelle oder automatische Zeiterfassung.{"  "}
        Tabelle <code>time_entries</code> mit <code>project_id</code>.
      </p>
    </div>
  );
}

function VacationPanel({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Urlaubsplaner</h2>
      <p className="text-sm text-white/70">
        Urlaubsanträge und Freigabeprozess.{"  "}
        Tabelle <code>vacations</code> mit <code>project_id</code>.
      </p>
    </div>
  );
}

function TasksPanel({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Projektaufgaben</h2>
      <p className="text-sm text-white/70">
        Aufgabenverwaltung, Status, Priorität.{"  "}
        Tabelle <code>tasks</code> mit <code>project_id</code>.
      </p>
    </div>
  );
}

function CommsPanel({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Kommunikation</h2>
      <p className="text-sm text-white/70">
        Chat / Kommentare innerhalb des Projekts.{"  "}
        Tabelle <code>comments</code> mit <code>project_id</code>.
      </p>
    </div>
  );
}

function ReportsPanel({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Berichte & Export</h2>
      <p className="text-sm text-white/70">
        Generierung von CSV/PDF-Berichten.{"  "}
        Daten aus anderen Modulen.
      </p>
    </div>
  );
}

function LocationsPanel({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Standortplanung</h2>
      <p className="text-sm text-white/70">
        Zuordnung von Aufgaben oder Schichten zu Orten.{"  "}
        Tabelle <code>locations</code> mit <code>project_id</code>.
      </p>
    </div>
  );
}
