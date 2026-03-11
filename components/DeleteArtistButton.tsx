"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteArtistButtonProps {
  artistId: string;
  artistName: string;
}

export function DeleteArtistButton({ artistId, artistName }: DeleteArtistButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar a "${artistName}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await fetch(`/api/artists/${artistId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
