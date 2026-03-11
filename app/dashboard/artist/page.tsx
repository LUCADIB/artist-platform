import { createSupabaseServerClient } from '../../../lib/supabaseClient'
import { LogoutButton } from '../../../components/LogoutButton'

export default async function ArtistDashboardPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: profile } = session
    ? await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    : { data: null }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Panel del artista
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Bienvenido a tu espacio personal.
          </p>
        </div>
        <LogoutButton />
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">
          Sesión iniciada como{' '}
          <span className="font-medium text-neutral-900">
            {session?.user.email ?? '—'}
          </span>{' '}
          · Rol:{' '}
          <span className="font-medium text-neutral-900">
            {profile?.role ?? '—'}
          </span>
        </p>
      </div>
    </div>
  )
}
