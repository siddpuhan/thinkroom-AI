import "./lib/env-init";
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

export async function proxy(request: NextRequest) {
  console.log("PROXY EXECUTION: APP_BASE_URL =", process.env.APP_BASE_URL, "ROUTES =", (auth0 as any).routes);
  let authRes;
  try {
    authRes = await auth0.middleware(request);
  } catch (err: any) {
    console.error("PROXY ERROR IN AUTH0 MIDDLEWARE:", err.message, err.stack);
    return new NextResponse(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500 });
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/chat') || pathname.startsWith('/resources')) {
    const session = await auth0.getSession(request);
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return authRes;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ]
};
