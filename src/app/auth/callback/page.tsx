"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const run = async () => {
      // aktuelle URL mit dem Code an Supabase übergeben
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("Fehler beim Login:", error.message);
        // optional: Fehlerseite oder Toast
      }

      // nach erfolgreicher Anmeldung weiterleiten
      router.replace("/");
    };

    run();
  }, [router, supabase]);

  return <div className="p-6 text-sm opacity-80">Anmeldung läuft …</div>;
}
