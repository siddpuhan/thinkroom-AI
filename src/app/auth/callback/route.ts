import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase-server";

// OAuth callback handler.
// Supabase redirects here after a successful Google auth. We exchange the
// authorization code for a session (the SSR client sets the httpOnly cookie
// automatically), then redirect the user to /chat.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = request.nextUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/chat", origin));
}
