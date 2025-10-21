export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
return (
<section className="space-y-6">
<div className="flex items-end justify-between">
<div>
<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
<p className="text-white/60 text-sm">Sauberer Startpunkt für dein Admin-Dashboard.</p>
</div>
<div className="flex items-center gap-2">
<button className="btn btn-primary">Aktion</button>
<button className="btn card border-white/20">Sekundär</button>
</div>
</div>
{children}
</section>
)
}