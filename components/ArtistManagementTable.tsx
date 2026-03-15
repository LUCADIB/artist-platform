"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowserClient";
import { ArtistForm } from "./ArtistForm";
import { DeleteArtistButton } from "./DeleteArtistButton";
import type { VideoData } from "./VideoLinksManager";

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
  status: string;
  rejection_reason: string | null;
  created_by_admin: boolean;
  managed_by_admin: boolean;
  home_featured_rank: number | null;
  categories: { id: string; name: string } | null;
}

interface ArtistManagementTableProps {
  artists: Artist[];
  categories: Category[];
}

/**
 * Status badge component with appropriate styling.
 */
function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    pending_review: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      label: "Pendiente",
    },
    approved: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Aprobado",
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Rechazado",
    },
    draft: {
      bg: "bg-neutral-100",
      text: "text-neutral-600",
      label: "Borrador",
    },
    suspended: {
      bg: "bg-neutral-200",
      text: "text-neutral-700",
      label: "Suspendido",
    },
  };

  const { bg, text, label } = config[status] || config.draft;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

/**
 * Approval buttons for pending/rejected artists.
 */
function ApprovalButtons({
  artistId,
  onAction,
}: {
  artistId: string;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al aprobar");
      }
      onAction();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al aprobar el artista");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      alert("Ingresa el motivo del rechazo");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          rejection_reason: rejectReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al rechazar");
      }
      onAction();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al rechazar el artista");
    } finally {
      setLoading(false);
      setShowRejectInput(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
      >
        Aprobar
      </button>
      {showRejectInput ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo del rechazo"
            className="w-32 rounded border border-neutral-200 px-2 py-1 text-xs"
          />
          <button
            onClick={handleReject}
            disabled={loading}
            className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white"
          >
            OK
          </button>
          <button
            onClick={() => setShowRejectInput(false)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs"
          >
            X
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowRejectInput(true)}
          disabled={loading}
          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          Rechazar
        </button>
      )}
    </div>
  );
}

/**
 * Toggle button for "Gestionado por agencia" (managed_by_admin).
 * When enabled, the artist appears in the manager's availability selector
 * and all booking contacts are routed to the manager.
 */
function ManagedToggle({
  artistId,
  initialValue,
  onToggle,
}: {
  artistId: string;
  initialValue: boolean;
  onToggle: () => void;
}) {
  const [isManaged, setIsManaged] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  // Sync local state with prop when server data refreshes
  useEffect(() => {
    setIsManaged(initialValue);
  }, [initialValue]);

  async function handleToggle() {
    setLoading(true);
    try {
      const newValue = !isManaged;
      console.log("[ManagedToggle] Sending PUT request to /api/artists/" + artistId, { managed_by_admin: newValue });
      const res = await fetch(`/api/artists/${artistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Explicitly send cookies
        body: JSON.stringify({ managed_by_admin: newValue }),
      });
      console.log("[ManagedToggle] Response status:", res.status, res.statusText);
      const data = await res.json();
      console.log("[ManagedToggle] Response data:", data);
      if (!res.ok) {
        // Revert optimistic update on error
        throw new Error(data.error || "Error al actualizar");
      }
      setIsManaged(newValue);
      onToggle();
    } catch (err) {
      console.error("[ManagedToggle] Error:", err);
      alert(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
        isManaged
          ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
          : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
      }`}
      title={isManaged ? "Quitar gestión de agencia" : "Gestionar como agencia"}
    >
      {loading ? (
        "..."
      ) : isManaged ? (
        <>
          <svg
            className="mr-1 h-3 w-3"
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
          Gestionado por agencia
        </>
      ) : (
        "Gestionar"
      )}
    </button>
  );
}

/**
 * Featured rank input for home page positioning.
 * Allows setting rank 1-10 or clearing (null) to remove from featured.
 */
function FeaturedRankInput({
  artistId,
  initialRank,
  onUpdated,
}: {
  artistId: string;
  initialRank: number | null;
  onUpdated: () => void;
}) {
  const [rank, setRank] = useState<string>(
    initialRank !== null ? String(initialRank) : ""
  );
  const [loading, setLoading] = useState(false);

  // Sync local state with prop when server data refreshes
  useEffect(() => {
    setRank(initialRank !== null ? String(initialRank) : "");
  }, [initialRank]);

  async function handleBlur() {
    const newRank = rank === "" ? null : parseInt(rank, 10);

    // Validate range
    if (newRank !== null && (newRank < 1 || newRank > 10)) {
      setRank(initialRank !== null ? String(initialRank) : "");
      return;
    }

    // Skip if unchanged
    if (newRank === initialRank) return;

    setLoading(true);
    try {
      const res = await fetch("/api/artists/featured", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, rank: newRank }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar");
      }
      onUpdated();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al actualizar");
      setRank(initialRank !== null ? String(initialRank) : "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <input
      type="number"
      min={1}
      max={10}
      value={rank}
      onChange={(e) => setRank(e.target.value)}
      onBlur={handleBlur}
      disabled={loading}
      placeholder="—"
      className="w-12 rounded border border-neutral-200 px-2 py-1 text-center text-xs disabled:opacity-50"
    />
  );
}

export function ArtistManagementTable({
  artists: initialArtists,
  categories: initialCategories,
}: ArtistManagementTableProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [editingVideos, setEditingVideos] = useState<VideoData[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [refreshKey, setRefreshKey] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state with server props when they change (after router.refresh())
  useEffect(() => {
    setArtists(initialArtists);
  }, [initialArtists]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Debounce search input (300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch artists when debounced query changes
  const fetchArtists = useCallback(async (query: string) => {
    const supabase = createSupabaseBrowserClient();

    if (!query) {
      // No query: fetch all artists
      const { data } = await supabase
        .from("artists")
        .select(
          "id, name, slug, city, bio, avatar_url, category_id, status, rejection_reason, created_by_admin, managed_by_admin, home_featured_rank, categories ( id, name )"
        )
        .order("created_at", { ascending: false });
      setArtists((data ?? []) as unknown as Artist[]);
      return;
    }

    // Search by name, city, or category name
    const likePattern = `%${query}%`;

    // Get category IDs that match the query
    const { data: matchingCategories } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", likePattern);

    const categoryIds = (matchingCategories ?? []).map((c) => c.id);

    // Build OR query for name, city, and category_id
    let queryBuilder;
    if (categoryIds.length > 0) {
      // Include category filter in OR query
      queryBuilder = supabase
        .from("artists")
        .select(
          "id, name, slug, city, bio, avatar_url, category_id, status, rejection_reason, created_by_admin, managed_by_admin, home_featured_rank, categories ( id, name )"
        )
        .or(`name.ilike.%${query}%,city.ilike.%${query}%,category_id.in.(${categoryIds.join(",")})`);
    } else {
      // No matching categories, only search name and city
      queryBuilder = supabase
        .from("artists")
        .select(
          "id, name, slug, city, bio, avatar_url, category_id, status, rejection_reason, created_by_admin, managed_by_admin, home_featured_rank, categories ( id, name )"
        )
        .or(`name.ilike.%${query}%,city.ilike.%${query}%`);
    }

    const { data } = await queryBuilder.order("created_at", { ascending: false });
    setArtists((data ?? []) as unknown as Artist[]);
  }, []);

  useEffect(() => {
    setIsSearching(true);
    fetchArtists(debouncedQuery).finally(() => setIsSearching(false));
  }, [debouncedQuery, fetchArtists]);

  // Fetch videos when editing artist changes
  useEffect(() => {
    if (!editingArtist?.id) {
      setEditingVideos([]);
      return;
    }

    setVideosLoading(true);
    fetch(`/api/artist-videos?artistId=${editingArtist.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEditingVideos(data);
        }
      })
      .catch(() => {
        setEditingVideos([]);
      })
      .finally(() => {
        setVideosLoading(false);
      });
  }, [editingArtist?.id]);

  function handleCategoryCreated(newCategory: Category) {
    setCategories((prev) => {
      if (prev.some((c) => c.id === newCategory.id)) return prev;
      return [...prev, newCategory];
    });
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    router.refresh();
  }

  return (
    <div className="space-y-4" key={refreshKey}>
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar artista..."
          className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="h-4 w-4 animate-spin text-neutral-400"
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
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-neutral-500">
          {artists.length} artista{artists.length !== 1 ? "s" : ""} registrado
          {artists.length !== 1 ? "s" : ""}
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
          <h3 className="mb-4 text-sm font-semibold text-neutral-800">
            Crear artista
          </h3>
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
          <h3 className="mb-4 text-sm font-semibold text-neutral-800">
            Editar artista
          </h3>
          {videosLoading ? (
            <p className="text-sm text-neutral-400">Cargando datos…</p>
          ) : (
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
              initialVideos={editingVideos}
              onCancel={() => setEditingArtist(null)}
              onCategoryCreated={handleCategoryCreated}
            />
          )}
        </div>
      )}

      {/* Table */}
      {isSearching ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <svg
              className="h-4 w-4 animate-spin"
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
            Buscando...
          </div>
        </div>
      ) : artists.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white">
          <p className="text-sm text-neutral-400">
            {debouncedQuery ? "No se encontraron artistas." : "No hay artistas todavía."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  {["Nombre", "Estado", "Destacado", "Gestión", "Ciudad", "Categoría", "Acciones"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500"
                      >
                        {col}
                      </th>
                    )
                  )}
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
                        <div>
                          <span className="font-medium text-neutral-900">
                            {artist.name}
                          </span>
                          {artist.managed_by_admin && (
                            <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                              Gestionado por agencia
                            </span>
                          )}
                          {!artist.created_by_admin && (
                            <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                              Auto-registrado
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={artist.status || "draft"} />
                    </td>
                    <td className="px-4 py-3">
                      <FeaturedRankInput
                        artistId={artist.id}
                        initialRank={artist.home_featured_rank}
                        onUpdated={handleRefresh}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ManagedToggle
                        artistId={artist.id}
                        initialValue={artist.managed_by_admin || false}
                        onToggle={handleRefresh}
                      />
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {artist.city ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {artist.categories?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(artist.status === "pending_review" || (!artist.status && !artist.created_by_admin)) && (
                          <ApprovalButtons
                            artistId={artist.id}
                            onAction={handleRefresh}
                          />
                        )}
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-neutral-900">
                          {artist.name}
                        </p>
                        {artist.managed_by_admin && (
                          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                            Gestionado por agencia
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-neutral-400">
                        {artist.slug ?? "—"}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={artist.status || "draft"} />
                </div>
                <div className="mb-3 flex items-center gap-2 text-xs text-neutral-500">
                  <span>{artist.city ?? "—"}</span>
                  {artist.categories?.name && (
                    <>
                      <span>·</span>
                      <span>{artist.categories.name}</span>
                    </>
                  )}
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">Destacado:</span>
                    <FeaturedRankInput
                      artistId={artist.id}
                      initialRank={artist.home_featured_rank}
                      onUpdated={handleRefresh}
                    />
                  </div>
                  <ManagedToggle
                    artistId={artist.id}
                    initialValue={artist.managed_by_admin || false}
                    onToggle={handleRefresh}
                  />
                </div>
                {(artist.status === "pending_review" || (!artist.status && !artist.created_by_admin)) && (
                  <div className="mb-3">
                    <ApprovalButtons
                      artistId={artist.id}
                      onAction={handleRefresh}
                    />
                  </div>
                )}
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
