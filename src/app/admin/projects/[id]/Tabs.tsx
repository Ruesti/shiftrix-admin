"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Tab = { key: string; label: string };

export default function Tabs({
  projectId,
  tabs,
}: {
  projectId: string;
  tabs: Tab[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("tab") ?? tabs[0]?.key ?? "overview";

  function handleClick(tab: string, e: React.MouseEvent) {
    e.preventDefault();
    router.push(`/admin/projects/${projectId}?tab=${tab}`);
  }

  return (
    <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
      {tabs.map((t) => {
        const selected = t.key === current;
        return (
          <a
            key={t.key}
            href={`/admin/projects/${projectId}?tab=${t.key}`}
            onClick={(e) => handleClick(t.key, e)}
            className={[
              "rounded-md px-3 py-1.5 text-sm transition border cursor-pointer",
              selected
                ? "bg-white/10 border-white/20"
                : "border-transparent hover:border-white/15",
            ].join(" ")}
          >
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
