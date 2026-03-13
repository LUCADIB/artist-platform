import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "./lib/supabaseClient";

/**
 * Middleware for authentication and role-based access control.
 *
 * Handles:
 * - Session refresh
 * - Protected route access
 * - Role-based dashboard routing
 * - Registration page access control
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Base response that we'll potentially modify
  const response = NextResponse.next();

  const supabase = createSupabaseMiddlewareClient(request, response);

  // Refresh session if expired (important for SSR)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register/artist";

  // Unauthenticated user trying to access a protected route
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user — fetch their role
  if (session && (isProtectedRoute || isLoginPage || isRegisterPage)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    // Support both 'manager' and 'admin' roles for backward compatibility
    const role = profile?.role as
      | "manager"
      | "admin"
      | "artist"
      | undefined;
    const isManager = role === "manager" || role === "admin";

    // Already-logged-in user visiting /login → send to their dashboard
    if (isLoginPage) {
      if (isManager) {
        return NextResponse.redirect(
          new URL("/dashboard/manager", request.url)
        );
      }
      if (role === "artist") {
        return NextResponse.redirect(
          new URL("/dashboard/artist", request.url)
        );
      }
    }

    // Already-logged-in user visiting /register/artist → send to their dashboard
    if (isRegisterPage) {
      if (isManager) {
        return NextResponse.redirect(
          new URL("/dashboard/manager", request.url)
        );
      }
      if (role === "artist") {
        return NextResponse.redirect(
          new URL("/dashboard/artist", request.url)
        );
      }
    }

    // Role-based access control for protected routes
    if (isProtectedRoute) {
      // Managers/admins cannot access artist dashboard
      if (isManager && pathname.startsWith("/dashboard/artist")) {
        return NextResponse.redirect(
          new URL("/dashboard/manager", request.url)
        );
      }
      // Artists cannot access manager dashboard
      if (role === "artist" && pathname.startsWith("/dashboard/manager")) {
        return NextResponse.redirect(
          new URL("/dashboard/artist", request.url)
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register/artist"],
};
