"use client";

import { useTransition } from "react";
import { deleteProjectAction } from "./_actions";

export default function DeleteProjectButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="rounded-lg border border-red-400/40 text-red-200 px-2 py-1 hover:bg-red-500/20 disabled:opacity-60"
      onClick={() => {
        if (!confirm("Projekt wirklich löschen?")) return;
        startTransition(() => {
          void deleteProjectAction(id);
        });
      }}
      disabled={isPending}
    >
      {isPending ? "Lösche…" : "Löschen"}
    </button>
  );
}
