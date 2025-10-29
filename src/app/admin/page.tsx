// src/app/admin/page.tsx
import Link from "next/link";
import { fetchDashboardModules } from "./actions.server";
import CustomizeDashboardModal from "./CustomizeDashboardModal";
import { kpiLabelFor } from "./kpiDefs";

// --- Dummy Widget-Komponente ---
function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="text-sm uppercase tracking-wide text-white/50">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/60">{hint}</div>}
    </div>
  );
}

// --- Widget Registry ---
const WIDGETS: Record<string, () => JSX.Element> = {
  "kpi:heute":            () => <Card title="Heute" value="0 Anfragen" hint="Offene Punkte am heutigen Tag" />,
  "kpi:offene-schichten": () => <Card title="Offene Schichten" value="0" hint="Unbesetzte Slots" />,
  "kpi:genehmigungen":    () => <Card title="Genehmigungen" value="0" hint="Ausstehend" />,
  "kpi:auslastung":       () => <Card title="Auslastung" value="–" hint="Bald verfügbar" />,
  "kpi:urlaub":          () => <Card title="Urlaub" value="0 Anfragen" hint="Offene Urlaubsanträge" />,
};

// --- Widget Renderer ---
function Widgets({ keys }: { keys: string[] }) {
  if (keys.length === 0) {
    return (
      <p className="text-white/60">
        Noch keine KPI-Widgets ausgewählt. Klicke oben auf <i>Seite anpassen</i>.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {keys.map((k) => {
        const Widget = WIDGETS[k];
        return Widget ? <Widget key={k} /> : null;
      })}
    </div>
  );
}

// --- Hauptseite ---
export default async function AdminDashboardPage() {
  const selected = await fetchDashboardModules();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      {/* Headline */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Admin-Dashboard</h1>
          <p className="text-white/70">Verwalte Projekte, Module und Grundeinstellungen.</p>
        </div>

        <CustomizeDashboardModal initialSelected={selected} />
      </header>

      {/* Navigation */}
      <nav className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin/projects" className="rounded-md border border-white/10 px-3 py-2 hover:border-white/20">
          Projekte
        </Link>
        <Link href="/admin/employees" className="rounded-md border border-white/10 px-3 py-2 hover:border-white/20">
          Mitarbeiter
        </Link>
        <Link href="/admin/settings" className="rounded-md border border-white/10 px-3 py-2 hover:border-white/20">
          Einstellungen
        </Link>
      </nav>

      {/* KPI-Widgets */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">KPI-Widgets</h2>
        <Widgets keys={selected} />
      </div>

      {/* Fußzeile */}
      <footer className="pt-8 text-sm text-white/50">
        Shiftrix Admin · v0.1 · Module:{" "}
        {selected.length > 0 ? selected.map((k) => kpiLabelFor(k)).join(", ") : "keine"}
      </footer>
    </section>
  );
}
