import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return <pre style={{ padding: 24 }}>{error.message}</pre>;
  if (!data?.length)
    return <div style={{ padding: 24 }}>Noch keine Projekte.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Letzte Projekte</h1>
      <ul>
        {data.map((p) => (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <b>{p.name}</b> — {p.id} —{" "}
            <Link href={`/admin/projects/${p.id}/timeline`}>Timeline</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
