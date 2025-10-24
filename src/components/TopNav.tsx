"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/projects", label: "Projekte" },
    { href: "/admin/employees", label: "Mitarbeiter" },
    { href: "/admin/settings", label: "Einstellungen" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Branding */}
        <Link
          href="/admin"
          className="text-lg font-semibold tracking-tight text-white hover:text-orange-400 transition"
        >
          Shiftrix&nbsp;<span className="text-orange-400">Admin</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition ${
                isActive(link.href)
                  ? "text-white border-b-2 border-orange-500 pb-0.5"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Placeholder (optional später) */}
        <div className="md:hidden text-white/70 text-sm">☰</div>

        {/* Rechts: Benutzer / Logout */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => alert("Logout (später Supabase Auth)")}
            className="text-xs text-white/60 hover:text-white transition"
          >
            Abmelden
          </button>
        </div>
      </div>
    </header>
  );
}
