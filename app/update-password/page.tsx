'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowserClient'

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm">
          <div className="flex items-center justify-center">
            <svg
              className="h-6 w-6 animate-spin text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Main update password content component
 */
function UpdatePasswordContent() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  // Verify recovery session on mount
  useEffect(() => {
    const verifySession = async () => {
      const supabase = createSupabaseBrowserClient()

      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)

      if (error) {
        setIsValidSession(false)
        setError('El enlace de recuperación es inválido o ha expirado.')
      } else {
        setIsValidSession(true)
      }
    }

    verifySession()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const supabase = createSupabaseBrowserClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError('Error al actualizar la contraseña. Intenta de nuevo.')
        return
      }

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return <LoadingFallback />
  }

  // Invalid session state
  if (isValidSession === false) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Enlace inválido
              </h1>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <a
              href="/reset-password"
              className="mt-4 block w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-neutral-700"
            >
              Solicitar nuevo enlace
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Nueva contraseña
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              Crea una nueva contraseña para tu cuenta
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                <p className="font-medium">Contraseña actualizada</p>
                <p className="mt-1">Serás redirigido al inicio de sesión…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 pr-10 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-500 focus:bg-white focus:ring-2 focus:ring-neutral-200 disabled:opacity-50"
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 pr-10 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-500 focus:bg-white focus:ring-2 focus:ring-neutral-200 disabled:opacity-50"
                    placeholder="Repite tu contraseña"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
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
                {loading ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Update password page - wrapped in Suspense for useSearchParams
 */
export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UpdatePasswordContent />
    </Suspense>
  )
}
