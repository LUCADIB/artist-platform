'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      )

      if (resetError) {
        setError('Error al enviar el correo. Intenta de nuevo.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Recuperar contraseña
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              Ingresa tu correo para recibir un enlace de recuperación
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                <p className="font-medium">Correo enviado</p>
                <p className="mt-1">
                  Si el correo existe recibirás un enlace para recuperar tu contraseña.
                </p>
              </div>
              <a
                href="/login"
                className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Volver al inicio de sesión
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-500 focus:bg-white focus:ring-2 focus:ring-neutral-200 disabled:opacity-50"
                  placeholder="tu@correo.com"
                  disabled={loading}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>

              {/* Back to login */}
              <p className="text-center text-sm">
                <a
                  href="/login"
                  className="font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
                >
                  Volver al inicio de sesión
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
