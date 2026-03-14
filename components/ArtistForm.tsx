"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { VideoLinksManager, type VideoData } from "./VideoLinksManager";

interface Category {
  id: string;
  name: string;
}

interface ArtistFormData {
  name: string;
  slug: string;
  city: string;
  bio: string;
  avatar_url: string;
  category_id: string;
}

interface ArtistFormProps {
  initialCategories: Category[];
  initialData?: ArtistFormData & { id: string };
  initialVideos?: VideoData[];
  onCancel: () => void;
  onCategoryCreated?: (category: Category) => void;
}

export function ArtistForm({
  initialCategories,
  initialData,
  initialVideos = [],
  onCancel,
  onCategoryCreated,
}: ArtistFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ArtistFormData>({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    city: initialData?.city ?? "",
    bio: initialData?.bio ?? "",
    avatar_url: initialData?.avatar_url ?? "",
    category_id: initialData?.category_id ?? "",
  });

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.avatar_url ?? "");

  // Video state - for editing, videos are managed via VideoLinksManager
  const [videos, setVideos] = useState<VideoData[]>(initialVideos);

  // Category creation state
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryCreating, setCategoryCreating] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  // Category creation
  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    setCategoryCreating(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error al crear categoría");
      }
      const newCat: Category = await res.json();
      setCategories((prev) => [...prev, newCat]);
      setFormData((prev) => ({ ...prev, category_id: newCat.id }));
      setNewCategoryName("");
      setShowNewCategory(false);
      onCategoryCreated?.(newCat);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al crear la categoría");
    } finally {
      setCategoryCreating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create or update the artist record
      const url = isEditing ? `/api/artists/${initialData!.id}` : "/api/artists";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          avatar_url: formData.avatar_url || null,
          category_id: formData.category_id || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Error inesperado");
      }

      const savedArtist = await res.json();
      const artistId: string = savedArtist.id ?? initialData!.id;

      // Step 2: Upload image if a new file was selected
      if (imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", imageFile);
        uploadForm.append("artistId", artistId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          throw new Error(uploadJson.error ?? "Error al subir la imagen");
        }

        const { url: publicUrl } = await uploadRes.json();

        // Update artist record with the new avatar_url
        const updateRes = await fetch(`/api/artists/${artistId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            avatar_url: publicUrl,
            category_id: formData.category_id || null,
          }),
        });

        if (!updateRes.ok) {
          const updateJson = await updateRes.json();
          throw new Error(updateJson.error ?? "Error al guardar la URL de la imagen");
        }
      }

      // Note: Videos are now managed independently via VideoLinksManager
      // No video syncing needed here

      router.refresh();
      onCancel();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition";
  const labelClass = "block text-xs font-medium text-neutral-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Basic info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nombre *</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Nombre del artista"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            placeholder="url-del-artista"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Ciudad</label>
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Ciudad"
            className={inputClass}
          />
        </div>

        {/* Category + inline creation */}
        <div>
          <label className={labelClass}>Categoría</label>
          <div className="flex items-center gap-2">
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={`${inputClass} flex-1`}
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setShowNewCategory((prev) => !prev);
                setNewCategoryName("");
              }}
              className="shrink-0 rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 whitespace-nowrap"
            >
              + Nueva
            </button>
          </div>

          {showNewCategory && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                placeholder="Nombre de la categoría"
                className={`${inputClass} flex-1`}
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={categoryCreating || !newCategoryName.trim()}
                className="shrink-0 rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {categoryCreating ? "…" : "Crear"}
              </button>
            </div>
          )}
        </div>

        {/* Image upload */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Imagen del artista</label>
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
                Subir imagen
              </button>
              {imageFile && (
                <p className="mt-1.5 text-xs text-neutral-500 truncate max-w-xs">
                  {imageFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="sm:col-span-2">
          <label className={labelClass}>Biografía</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            placeholder="Descripción del artista..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Videos section - only for editing existing artists */}
      {isEditing && initialData?.id && (
        <div className="pt-4 border-t border-neutral-100">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">
            Videos del artista
          </h4>
          <VideoLinksManager
            artistId={initialData.id}
            initialVideos={videos}
          />
        </div>
      )}

      {/* Note for new artists */}
      {!isEditing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Podrás agregar videos después de crear el artista.
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear artista"}
        </button>
      </div>
    </form>
  );
}
