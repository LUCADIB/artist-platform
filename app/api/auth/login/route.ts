import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'El correo y la contraseña son obligatorios.' },
      { status: 400 }
    )
  }

  // Build a response we can attach cookies to
  const response = NextResponse.json({})

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set(name, '', options)
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    return NextResponse.json(
      { error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' },
      { status: 401 }
    )
  }

  // Fetch the user's role from the profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  // Support both 'manager' and 'admin' roles for backward compatibility
  const role = profile?.role as 'manager' | 'admin' | 'artist' | undefined
  const isManager = role === 'manager' || role === 'admin'

  let redirectTo = '/login'
  if (isManager) redirectTo = '/dashboard/manager'
  else if (role === 'artist') redirectTo = '/dashboard/artist'

  // Build the final response with proper JSON body + all cookies from interim response
  const finalResponse = NextResponse.json({ redirectTo }, { status: 200 })

  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return finalResponse
}
