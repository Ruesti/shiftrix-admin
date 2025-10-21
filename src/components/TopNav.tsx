import Link from 'next/link'


export function TopNav() {
return (
<header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
<div className="container flex h-14 items-center justify-between">
<Link href="/" className="font-semibold tracking-tight">Shiftrix Admin</Link>
<nav className="flex items-center gap-3 text-sm text-white/80">
<Link href="/admin" className="hover:text-white">Dashboard</Link>
<Link href="#" className="hover:text-white">Mitarbeiter</Link>
<Link href="#" className="hover:text-white">Schichten</Link>
<Link href="#" className="hover:text-white">Berichte</Link>
</nav>
</div>
</header>
)
}