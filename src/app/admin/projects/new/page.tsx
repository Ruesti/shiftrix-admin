import { redirect } from "next/navigation";

// Server Component (kein "use client")
export default function Page() {
  redirect("/admin/projects/create");
}
