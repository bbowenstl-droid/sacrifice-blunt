import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects /admin with HTTP Basic auth. Fails closed: if ADMIN_PASSWORD is not
 * configured, nobody gets in. Replace with Supabase Auth when the database goes live.
 */
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER ?? "coach";
  const pass = process.env.ADMIN_PASSWORD;
  const header = req.headers.get("authorization") ?? "";
  if (pass && header.startsWith("Basic ")) {
    const [u, p] = atob(header.slice(6)).split(":");
    if (u === user && p === pass) return NextResponse.next();
  }
  return new NextResponse(pass ? "Authentication required." : "Admin is disabled until ADMIN_PASSWORD is set.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Sacrifice Blunt admin", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
