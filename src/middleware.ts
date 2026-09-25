/**
 * Role-Based Access Control & Authentication Middleware
 *
 * Logic:
 * 1. Protects all routes matching `/dashboard/:path*`.
 * 2. Redirects unauthenticated users directly to `/login`.
 * 3. Enforces strict role-based access for authenticated users:
 *    - `/dashboard/artist/*` requires role "artist"
 *    - `/dashboard/buyer/*`  requires role "buyer"
 *    - `/dashboard/admin/*`  requires role "admin"
 * 4. Redirects unauthorized role access attempts to `/login`.
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const pathname = req.nextUrl.pathname;

    // Block access to /dashboard/artist/* unless role is "artist" or "admin"
    if (pathname.startsWith("/dashboard/artist") && role !== "artist" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Block access to /dashboard/buyer/* unless role is "buyer"
    if (pathname.startsWith("/dashboard/buyer") && role !== "buyer") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Block access to /dashboard/admin/* unless role is "admin"
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Returns true if authenticated, allowing inner middleware to run role checks
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
