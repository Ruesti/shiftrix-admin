import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Nur Admin-Bereich schützen
  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const url = req.nextUrl;

  // Kein Login → redirect auf /login
  if (!session) {
    const redirectUrl = new URL("/login", url.origin);
    redirectUrl.searchParams.set("redirectTo", url.pathname + url.search);
    return NextResponse.redirect(redirectUrl);
  }

  // Optional: Domain-Whitelist (z. B. nur Team)
  const allowed = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;
  if (allowed && !session.user.email?.endsWith(`@${allowed}`)) {
    return NextResponse.redirect(new URL("/login?denied=domain", url.origin));
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
