"use client";

import { useState } from "react";
import { ArtistForm } from "./ArtistForm";
import { DeleteArtistButton } from "./DeleteArtistButton";

interface Category {
  id: string;
  name: string;
}

interface Artist {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  category_id: string | null;
  categories: { id: string; name: string } | null;
}

interface ArtistManagementTableProps {
  artists: Artist[];
  categories: Category[];
}

export function ArtistManagementTable({ artists, categories: initialCategories }: ArtistManagementTableProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  // Local categories state so inline creation updates the dropdown globally
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  function handleCategoryCreated(newCategory: Category) {
    setCategories((prev) => {
      if (prev.some((c) => c.id === newCategory.id)) return prev;
      return [...prev, newCategory];
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-neutral-500">
          {artists.length} artista{artists.length !== 1 ? "s" : ""} registrado{artists.length !== 1 ? "s" : ""}
        </span>
        {!showCreateForm && !editingArtist && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            + Crear artista
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-neutral-800">Crear artista</h3>
          <ArtistForm
            initialCategories={categories}
            onCancel={() => setShowCreateForm(false)}
            onCategoryCreated={handleCategoryCreated}
          />
        </div>
      )}

      {/* Edit form */}
      {editingArtist && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-neutral-800">Editar artista</h3>
          <ArtistForm
            initialCategories={categories}
            initialData={{
              id: editingArtist.id,
              name: editingArtist.name,
              slug: editingArtist.slug ?? "",
              city: editingArtist.city ?? "",
              bio: editingArtist.bio ?? "",
              avatar_url: editingArtist.avatar_url ?? "",
              category_id: editingArtist.category_id ?? "",
            }}
            onCancel={() => setEditingArtist(null)}
            onCategoryCreated={handleCategoryCreated}
          />
        </div>
      )}

      {/* Table */}
      {artists.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white">
          <p className="text-sm text-neutral-400">No hay artistas todavía.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  {["Nombre", "Slug", "Ciudad", "Categoría", "Acciones"].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {artists.map((artist) => (
                  <tr key={artist.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {artist.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={artist.avatar_url}
                            alt={artist.name}
                            className="h-8 w-8 rounded-full object-cover border border-neutral-200"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs text-neutral-400 font-medium">
                            {artist.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-neutral-900">{artist.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      {artist.slug ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {artist.city ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {artist.categories?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setShowCreateForm(false);
                            setEditingArtist(artist);
                          }}
                          className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                        >
                          Editar
                        </button>
                        <DeleteArtistButton
                          artistId={artist.id}
                          artistName={artist.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="border-b border-neutral-100 px-4 py-4 last:border-b-0"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {artist.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={artist.avatar_url}
                        alt={artist.name}
                        className="h-9 w-9 rounded-full object-cover border border-neutral-200"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-sm text-neutral-400 font-medium">
                        {artist.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-neutral-900">{artist.name}</p>
                      <p className="font-mono text-xs text-neutral-400">{artist.slug ?? "—"}</p>
                    </div>
                  </div>
                  {artist.categories?.name && (
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                      {artist.categories.name}
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-neutral-500">{artist.city ?? "—"}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingArtist(artist);
                    }}
                    className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Editar
                  </button>
                  <DeleteArtistButton
                    artistId={artist.id}
                    artistName={artist.name}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
