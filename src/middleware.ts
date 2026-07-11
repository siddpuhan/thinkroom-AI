import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Single auth guard. Protects /chat and /resources.
// Unauthenticated visitors land on /. Authenticated users proceed.
export async function middleware(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const publicPaths = ["/", "/auth/callback", "/_next", "/favicon.ico"];
  const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

  if (!isPublicPath && !user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user && pathname === "/") {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ]
};
