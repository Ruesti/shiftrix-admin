"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string>("/admin/projects");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("redirectTo");
    if (r) setRedirectTo(r);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = supabaseClient();

    // DEV/PROD-sicher: lieber ENV nutzen, sonst window.origin
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    // Invite-only (empfohlen) = false  |  Open registration = true
    const authMode = process.env.NEXT_PUBLIC_AUTH_MODE || "invite"; // "invite" | "open"
    const shouldCreateUser = authMode === "open";

    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(
      redirectTo
    )}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
        shouldCreateUser, // <— wichtig, sonst registriert sich jeder automatisch
      },
    });

    if (error) setError(error.message ?? String(error));
    else setSent(true);
  }

  const denied =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("denied")
      : null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold mb-4">Anmelden</h1>

        {denied === "domain" && (
          <p className="mb-3 text-sm text-red-300">
            Zugriff verweigert: E-Mail-Domain nicht erlaubt.
          </p>
        )}

        {sent ? (
          <p className="text-white/80">
            Magic-Link verschickt. Prüfe dein Postfach.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/80">E-Mail</label>
              <input
                className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@example.com"
                required
              />
            </div>

            {error && (
              <p className="text-red-300 text-sm">
                {error.includes("User not found")
                  ? "Kein Account vorhanden. Bitte Einladung anfordern."
                  : error}
              </p>
            )}

            <button
              className="w-full rounded-lg bg-softbrew-blue px-4 py-2 font-medium hover:opacity-90"
              type="submit"
            >
              Magic-Link senden
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
