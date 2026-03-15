"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ArtistVideosManager from "./ArtistVideosManager";
import type { VideoData } from "./VideoLinksManager";

interface Category {
  id: string;
  name: string;
}

interface ArtistData {
  id: string;
  name: string;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  whatsapp: string | null;
  category_id: string | null;
  status: string;
  rejection_reason: string | null;
  managed_by_admin: boolean;
  categories: { id: string; name: string } | null;
}

interface ArtistProfileFormProps {
  artist: ArtistData;
  categories: Category[];
  initialVideos?: VideoData[];
}

export function ArtistProfileForm({ 
  artist, 
  categories,
  initialVideos = []
}: ArtistProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState(artist.name);
  const [city, setCity] = useState(artist.city ?? "");
  const [categoryId, setCategoryId] = useState(artist.category_id ?? "");
  const [whatsapp, setWhatsapp] = useState(artist.whatsapp ?? "");
  const [bio, setBio] = useState(artist.bio ?? "");

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(artist.avatar_url ?? "");

  // UI state
  const [loading, setLoading] = useState(false);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canResubmit = artist.status === "rejected" || artist.status === "draft";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      let avatarUrl = artist.avatar_url;

      // Upload new image if selected
      if (imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", imageFile);
        uploadForm.append("artistId", artist.id);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          throw new Error(uploadJson.error || "Error al subir la imagen");
        }

        const { url } = await uploadRes.json();
        avatarUrl = url;
      }

      // Update artist profile
      const res = await fetch(`/api/artists/${artist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: artist.slug, // Keep existing slug
          city: city || null,
          category_id: categoryId || null,
          whatsapp: whatsapp || null,
          bio: bio || null,
          avatar_url: avatarUrl,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al guardar");
      }

      setSuccess("Perfil actualizado correctamente.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleResubmit() {
    setError(null);
    setResubmitLoading(true);

    try {
      const res = await fetch(`/api/artists/${artist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: artist.slug,
          city: city || null,
          category_id: categoryId || null,
          whatsapp: whatsapp || null,
          bio: bio || null,
          status: "pending_review",
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Error al enviar a revisión");
      }

      setSuccess("Perfil enviado a revisión correctamente.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setResubmitLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition";
  const labelClass = "block text-xs font-medium text-neutral-600 mb-1";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      {/* Agency Management Badge */}
      {artist.managed_by_admin && (
        <div className="mb-6 rounded-lg border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-violet-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="text-sm font-medium text-violet-700">
              Tu perfil está siendo gestionado por la agencia QuitoShows
            </p>
          </div>
          <p className="mt-2 text-xs text-violet-600">
            El número de WhatsApp y los datos de contacto están siendo administrados por la agencia.
          </p>
        </div>
      )}

      <form id="artist-profile-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className={labelClass}>Nombre artístico *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
            placeholder="Tu nombre artístico"
          />
        </div>

        {/* Slug (read-only) */}
        <div>
          <label className={labelClass}>URL del perfil</label>
          <input
            type="text"
            value={artist.slug ?? ""}
            readOnly
            className={`${inputClass} bg-neutral-50 text-neutral-500 cursor-not-allowed`}
          />
          <p className="mt-1 text-xs text-neutral-400">
            Esta URL es automática y no se puede cambiar.
          </p>
        </div>

        {/* City */}
        <div>
          <label className={labelClass}>Ciudad</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
            placeholder="¿En qué ciudad te encuentras?"
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* WhatsApp */}
        <div>
          <label className={labelClass}>
            WhatsApp
            {artist.managed_by_admin && (
              <span className="ml-2 text-xs text-violet-600">(Gestionado por agencia)</span>
            )}
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className={`${inputClass} ${artist.managed_by_admin ? "bg-neutral-50 text-neutral-500 cursor-not-allowed" : ""}`}
            placeholder="Número de WhatsApp (ej: 593999999999)"
            disabled={artist.managed_by_admin}
          />
          <p className="mt-1 text-xs text-neutral-400">
            {artist.managed_by_admin
              ? "La agencia está gestionando tu contacto. Para cambios, comunícate con QuitoShows."
              : "Solo visible para el administrador"}
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className={labelClass}>Biografía</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="Cuéntanos sobre ti, tu experiencia, tu estilo..."
          />
        </div>

        {/* Image upload */}
        <div>
          <label className={labelClass}>Foto de perfil</label>
          <div className="flex items-start gap-4">
            {imagePreview && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <svg
                  className="h-4 w-4 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Cambiar foto
              </button>
              {imageFile && (
                <p className="mt-1.5 text-xs text-neutral-500 truncate max-w-xs">
                  {imageFile.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Artist Videos Section */}
      <div className="mt-8 pt-8 border-t border-neutral-100">
        <h3 className="mb-4 text-sm font-semibold text-neutral-800 uppercase tracking-wider">
          Gestión de Videos
        </h3>
        <ArtistVideosManager 
          artistId={artist.id} 
          initialVideos={initialVideos} 
        />
      </div>

      {/* Error/Success messages */}
      <div className="mt-8 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          form="artist-profile-form"
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Guardar cambios"}
        </button>

        {canResubmit && (
          <button
            type="button"
            onClick={handleResubmit}
            disabled={resubmitLoading}
            className="rounded-lg border border-primary-600 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-100 disabled:opacity-50"
          >
            {resubmitLoading
              ? "Enviando…"
              : "Enviar a revisión"}
          </button>
        )}
      </div>
    </div>
  );
}
