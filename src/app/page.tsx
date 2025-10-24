// src/app/admin/page.tsx
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Admin-Dashboard</h1>
        <p className="text-white/70">
          Verwalte Projekte, Module und Grundeinstellungen von Shiftrix.
        </p>
      </header>

      {/* Wichtigster CTA */}
      <div className="flex flex-wrap gap-4">
        <Link
          href="/admin/projects"
          className="rounded-brand bg-orange-500/90 text-white px-5 py-3 text-sm font-medium shadow hover:shadow-lg active:scale-[0.99] transition"
        >
          🔧 Projekte öffnen
        </Link>
        <Link
          href="/admin/projects?new=1"
          className="rounded-md border border-white/10 px-5 py-3 text-sm hover:border-white/20 transition"
          title="Neues Projekt anlegen"
        >
          ➕ Neues Projekt
        </Link>
      </div>

      {/* Schnellzugriff-Kacheln */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Projekte */}
        <Link
          href="/admin/projects"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur hover:border-white/20 transition"
        >
          <h2 className="text-lg font-semibold">Projekte verwalten</h2>
          <p className="text-sm text-white/70 mt-1">
            Projekte anlegen, Module aktivieren und Einstellungen je Projekt konfigurieren.
          </p>
          <span className="inline-block mt-4 text-xs text-white/70 underline underline-offset-4">
            Zu /admin/projects →
          </span>
        </Link>

        {/* Einstellungen (Platzhalter für später) */}
        <Link
          href="/admin/settings"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur hover:border-white/20 transition"
        >
          <h2 className="text-lg font-semibold">Globale Einstellungen</h2>
          <p className="text-sm text-white/70 mt-1">
            Zeitzonen, Standardarbeitszeiten, Farben und weitere Defaults.
          </p>
          <span className="inline-block mt-4 text-xs text-white/70 underline underline-offset-4">
            Zu /admin/settings →
          </span>
        </Link>

        {/* Module (Platzhalter) */}
        <Link
          href="/admin/modules"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur hover:border-white/20 transition"
        >
          <h2 className="text-lg font-semibold">Baukasten-Module</h2>
          <p className="text-sm text-white/70 mt-1">
            Modulübersicht & Dokumentation (Schichtplan, Verfügbarkeit, Berichte …).
          </p>
          <span className="inline-block mt-4 text-xs text-white/70 underline underline-offset-4">
            Zu /admin/modules →
          </span>
        </Link>
      </div>

      {/* Fußleiste / Info */}
      <footer className="pt-2 text-xs text-white/50">
        Shiftrix Admin • v0.1 • Diese Oberfläche ist im Aufbau. Feedback willkommen.
      </footer>
    </section>
  );
}
