import { TopNav } from '@/components/TopNav'


export default function AdminLayout({ children }: { children: React.ReactNode }) {
return (
<div className="min-h-screen">
<TopNav />
<main className="container py-8">
{children}
</main>
</div>
)
}