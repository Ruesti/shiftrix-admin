export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";


import { AdminShell } from '@/components/AdminShell'


export default function AdminHome() {
return (
<AdminShell title="Dashboard">
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<section className="card p-4">
<h3 className="text-lg font-medium">Schnellstart</h3>
<p className="text-white/70 text-sm mt-2">Hier kannst du später Widgets wie KPIs, offene Schichten, Genehmigungen etc. einblenden.</p>
</section>
<section className="card p-4">
<h3 className="text-lg font-medium">Heute</h3>
<ul className="text-white/80 text-sm mt-2 list-disc list-inside">
<li>0 Anfragen</li>
<li>0 offene Schichten</li>
<li>0 Genehmigungen</li>
</ul>
</section>
<section className="card p-4">
<h3 className="text-lg font-medium">Nächste Schritte</h3>
<p className="text-white/70 text-sm mt-2">Beta-Login, Rollen & Rechte, Mitarbeiter, Schichtpläne, Abwesenheiten…</p>
</section>
</div>
</AdminShell>
)
}