"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

export default function ArtistRegisterPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {
        // Silently fail - category selection is optional
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          city: city || null,
          category_id: categoryId || null,
          whatsapp: whatsapp || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrar. Intenta de nuevo.");
        return;
      }

      // Success - redirect to artist dashboard
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-500 focus:bg-white focus:ring-2 focus:ring-neutral-200 disabled:opacity-50";
  const labelClass = "mb-1.5 block text-sm font-medium text-neutral-700";

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-sm">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Registro de artista
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              Crea tu cuenta y comienza a recibir reservas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Artist Name */}
            <div>
              <label htmlFor="name" className={labelClass}>
                Nombre artístico *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Tu nombre artístico"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Correo electrónico *
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="tu@correo.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirmar contraseña *
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Repite tu contraseña"
                disabled={loading}
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className={labelClass}>
                Ciudad
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
                placeholder="¿En qué ciudad te encuentras?"
                disabled={loading}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className={labelClass}>
                Categoría
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClass}
                disabled={loading}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp" className={labelClass}>
                WhatsApp
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className={inputClass}
                placeholder="Número de WhatsApp (ej: 593999999999)"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-neutral-400">
                Solo visible para el administrador
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Info about approval */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Tu perfil será revisado por el administrador antes de aparecer
              públicamente en la plataforma.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Registrando…" : "Crear cuenta"}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-neutral-500">
            ¿Ya tienes cuenta?{" "}
            <a
              href="/login"
              className="font-medium text-neutral-900 hover:underline"
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
