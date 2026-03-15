import { createServerClient, createBrowserClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client for client components
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server client for server components (read-only cookie access via next/headers)
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        // Server components can't set cookies, but we include this for completeness
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Ignore errors in server components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Ignore errors in server components
        }
      },
    },
  })
}

/**
 * Route handler client for API routes.
 * IMPORTANT: In Next.js App Router route handlers, cookies() must be awaited
 * and all cookie methods (get, set, remove) must be provided for auth to work.
 */
export async function createSupabaseRouteHandlerClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Route handlers can set cookies but this may fail in certain contexts
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Ignore errors
        }
      },
    },
  })
}

// Middleware client — reads/writes cookies from NextRequest/NextResponse
export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set(name, value)
        response.cookies.set(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set(name, '')
        response.cookies.set(name, '', options)
      },
    },
  })
}
