import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Für Server Components / Server Actions: Cookies read-only.
// set/remove sind No-Ops, damit es nicht in RSC crasht.
export async function supabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          /* no-op in RSC/Actions */
        },
        remove(_name: string, _options: CookieOptions) {
          /* no-op in RSC/Actions */
        },
      },
    }
  );
}
