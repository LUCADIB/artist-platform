import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from './lib/supabaseClient'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Base response that we'll potentially modify
  const response = NextResponse.next()

  const supabase = createSupabaseMiddlewareClient(request, response)

  // Refresh session if expired (important for SSR)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isProtectedRoute = pathname.startsWith('/dashboard')
  const isLoginPage = pathname === '/login'

  // Unauthenticated user trying to access a protected route
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user — fetch their role
  if (session && (isProtectedRoute || isLoginPage)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = profile?.role as 'manager' | 'artist' | undefined

    // Already-logged-in user visiting /login → send to their dashboard
    if (isLoginPage) {
      if (role === 'manager') {
        return NextResponse.redirect(new URL('/dashboard/manager', request.url))
      }
      if (role === 'artist') {
        return NextResponse.redirect(new URL('/dashboard/artist', request.url))
      }
    }

    // Role-based access control for protected routes
    if (isProtectedRoute) {
      if (role === 'manager' && pathname.startsWith('/dashboard/artist')) {
        return NextResponse.redirect(new URL('/dashboard/manager', request.url))
      }
      if (role === 'artist' && pathname.startsWith('/dashboard/manager')) {
        return NextResponse.redirect(new URL('/dashboard/artist', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
