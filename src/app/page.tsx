import Link from 'next/link'


export default function Page() {
return (
<main className="container py-16 space-y-8">
<header className="space-y-2">
<h1 className="text-4xl font-semibold tracking-tight">Shiftrix</h1>
<p className="text-white/70">Willkommen. Die Adminoberfläche findest du unten.</p>
</header>


<div className="card p-6">
<h2 className="text-2xl font-medium mb-2">Adminbereich</h2>
<p className="text-white/70 mb-4">Hier geht’s direkt zum Dashboard.</p>
<Link href="/admin" className="btn btn-primary">Zum Admin-Dashboard</Link>
</div>
</main>
)
}