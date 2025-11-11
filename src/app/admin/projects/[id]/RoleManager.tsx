// app/admin/projects/[id]/RoleManager.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Role = {
  id: string;
  project_id: string;
  name: string;
  color: string | null;
  is_builtin: boolean | null;
};

export function hasRealRole(roles: Role[], projectId: string) {
  return roles.some(
    (r) =>
      r.project_id === projectId &&
      (r.is_builtin === false ||
        r.is_builtin === null ||
        r.is_builtin === undefined)
  );
}

export default function RoleManager({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6b7280");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("project_id", projectId)
        .order("name");
      if (!mounted) return;
      if (!error) setRoles((data ?? []) as Role[]);
      setLoading(false);
    })();

    // Realtime optional
    const ch = supabase
      .channel("roles-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "roles",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRoles((prev) => [payload.new as Role, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setRoles((prev) =>
              prev.map((r) =>
                r.id === (payload.new as any).id ? (payload.new as Role) : r
              )
            );
          } else if (payload.eventType === "DELETE") {
            setRoles((prev) =>
              prev.filter((r) => r.id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [projectId, supabase]);

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    // Optimistic
    const temp: Role = {
      id: `temp_${Date.now()}`,
      project_id: projectId,
      name: trimmed,
      color,
      is_builtin: false,
    };
    setRoles((prev) => [temp, ...prev]);

    const { data, error } = await supabase
      .from("roles")
      .insert({
        project_id: projectId,
        name: trimmed,
        color,
        is_builtin: false,
      })
      .select()
      .single();

    if (error || !data) {
      // rollback
      setRoles((prev) => prev.filter((r) => r.id !== temp.id));
      return;
    }

    // replace temp by real
    setRoles((prev) =>
      prev.map((r) => (r.id === temp.id ? (data as Role) : r))
    );
    setName("");
  }

  const canDragIntoTimeline = useMemo(
    () => hasRealRole(roles, projectId),
    [roles, projectId]
  );

  return (
    <div className="space-y-4">
      <form onSubmit={createRole} className="flex items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rollenname (z. B. Bühnentechniker)"
          className="min-w-0 flex-1 rounded border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-white/30"
        />
        <input
          type="color"
          value={color ?? "#6b7280"}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-12 rounded border border-white/10 bg-transparent"
        />
        <button
          type="submit"
          className="rounded bg-white/10 px-4 py-2 hover:bg-white/15 transition"
        >
          Hinzufügen
        </button>
      </form>

      {loading ? (
        <div className="opacity-70">Lade Rollen …</div>
      ) : roles.length === 0 ? (
        <div className="opacity-70">Noch keine Rollen.</div>
      ) : (
        <ul className="space-y-2">
          {roles.map((r) => (
            <li
              key={r.id}
              className="rounded border border-white/10 px-3 py-2 flex items-center justify-between"
              style={{ borderLeft: `6px solid ${r.color ?? "#9ca3af"}` }}
            >
              <span>{r.name}</span>
              <span className="text-xs opacity-60">
                {r.is_builtin ? "System" : "Custom"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="text-sm opacity-80">
        {canDragIntoTimeline
          ? "Zeitleiste ist bereit: Rollen vorhanden."
          : "Bitte zuerst eine echte Rolle anlegen."}
      </div>
    </div>
  );
}
