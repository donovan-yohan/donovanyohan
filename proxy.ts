// Spike: Next 16 uses "proxy.ts" instead of "middleware.ts"
// (middleware.ts is deprecated in Next 16, renamed to proxy.ts)
// Redirects unauthenticated requests on /protected-test to sign-in.
//
// IMPORTANT CAVEAT: next-auth v5 exports an `auth` wrapper designed for Next 14/15 middleware.
// In Next 16, proxy runs on Node.js runtime (NOT Edge), so NextRequest from "next/server"
// is not guaranteed to work the same way. Using manual session check here.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/protected-test")) {
    // Check for next-auth session cookie (next-auth v5 uses __Secure-authjs.session-token or authjs.session-token)
    const sessionToken =
      req.cookies.get("__Secure-authjs.session-token")?.value ||
      req.cookies.get("authjs.session-token")?.value;

    if (!sessionToken) {
      const signInUrl = new URL("/api/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/protected-test", "/protected-test/:path*"],
};
