"use client";

import { useTransition } from "react";
import { deleteProjectAction } from "../_actions/deleteProject";

export default function DeleteProjectForm({ id }: { id: string }) {
  const [pending, start] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Projekt wirklich löschen?")) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    start(async () => {
      const form = new FormData();
      form.set("id", id);
      const res = await deleteProjectAction(form);
      if (!res?.ok) alert(`Löschen fehlgeschlagen: ${res?.error ?? "Unbekannter Fehler"}`);
      // Bei Erfolg revalidiert die Server-Action die Liste,
      // Next aktualisiert die Seite automatisch.
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1.5 rounded-brand border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
      >
        {pending ? "Lösche…" : "Löschen"}
      </button>
    </form>
  );
}
