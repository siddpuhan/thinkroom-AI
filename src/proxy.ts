import { NextRequest, NextResponse } from "next/server";
import { createClient } from "./lib/supabase-server";

// Single auth guard. Protects /chat and /resources.
// Unauthenticated visitors land on /. Authenticated users are sent to /chat.
export async function proxy(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  if (pathname === "/chat" || pathname === "/resources") {
    if (!session) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (session && pathname === "/") {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ]
};
