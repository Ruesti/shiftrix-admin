// app/admin/projects/new/page.tsx
import { createProjectAction } from "./actions";

export default function NewProjectPage() {
  return (
    <section className="p-6 space-y-4 max-w-xl">
      <h1 className="text-2xl font-semibold">Projekt erstellen</h1>
      <form action={createProjectAction} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm opacity-80">Name</label>
          <input
            name="name"
            required
            placeholder="z. B. Event Crew Q1"
            className="w-full rounded border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-white/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm opacity-80">Organisation (optional)</label>
          <input
            name="orgId"
            placeholder="org_123 (falls genutzt)"
            className="w-full rounded border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-white/30"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-white/10 px-4 py-2 hover:bg-white/15 transition"
        >
          Anlegen
        </button>
      </form>
    </section>
  );
}
