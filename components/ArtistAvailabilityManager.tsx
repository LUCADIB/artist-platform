"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AvailabilityBlock {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface ArtistAvailabilityManagerProps {
  artistId: string;
  initialBlocks: AvailabilityBlock[];
}

const STATUS_LABELS: Record<string, string> = {
  blocked: "Bloqueado",
  reserved: "Reservado",
  unavailable: "No disponible",
};

function formatTime(time: string): string {
  // Trim seconds if present: "20:00:00" → "20:00"
  return time.length > 5 ? time.slice(0, 5) : time;
}

export function ArtistAvailabilityManager({
  artistId,
  initialBlocks,
}: ArtistAvailabilityManagerProps) {
  const router = useRouter();

  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(initialBlocks);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync state when initialBlocks changes (after router.refresh())
  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  // Helper to sort blocks by date and start_time
  function sortBlocks(blocks: AvailabilityBlock[]): AvailabilityBlock[] {
    return [...blocks].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.start_time.localeCompare(b.start_time);
    });
  }

  async function handleBlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, date, startTime, createdByRole: "artist" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al bloquear el horario.");
      } else {
        if (data.block) {
          // Add new block and re-sort
          setBlocks((prev) => sortBlocks([...prev, data.block]));
        }
        setSuccess(true);
        setDate("");
        setStartTime("");
      }
    } catch {
      setError("Error de conexión. Por favor, intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(id);
    try {
      await fetch(`/api/availability/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Blocking form */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-sm font-semibold text-neutral-800">
          Bloquear nuevo horario
        </h3>
        <form onSubmit={handleBlock} className="space-y-4">
          {/* Date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError(null);
                setSuccess(false);
              }}
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            />
          </div>

          {/* Start time */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Hora de inicio
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setError(null);
                setSuccess(false);
              }}
              required
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            />
            <p className="mt-1 text-xs text-neutral-400">
              La hora de fin se calculará automáticamente (inicio + 90 min).
            </p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Horario bloqueado correctamente.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Guardando…" : "Bloquear horario"}
          </button>
        </form>
      </div>

      {/* Blocked slots list */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-800">
          Horarios bloqueados
        </h3>

        {blocks.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white">
            <p className="text-sm text-neutral-400">
              No hay horarios bloqueados todavía.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50">
                  <tr>
                    {["Fecha", "Hora inicio", "Hora fin", "Estado", ""].map(
                      (col, i) => (
                        <th
                          key={i}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {blocks.map((block) => (
                    <tr
                      key={block.id}
                      className="transition hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3 text-neutral-700">
                        {block.date}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {formatTime(block.start_time)}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {formatTime(block.end_time)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          {STATUS_LABELS[block.status] ?? block.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(block.id)}
                          disabled={deletingId === block.id}
                          className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === block.id
                            ? "Eliminando…"
                            : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="border-b border-neutral-100 px-4 py-5 last:border-b-0"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="font-semibold text-neutral-900">
                      {block.date}
                    </p>
                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      {STATUS_LABELS[block.status] ?? block.status}
                    </span>
                  </div>
                  <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <dt className="font-medium text-neutral-400">
                        Hora inicio
                      </dt>
                      <dd className="text-neutral-700">
                        {formatTime(block.start_time)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-neutral-400">Hora fin</dt>
                      <dd className="text-neutral-700">
                        {formatTime(block.end_time)}
                      </dd>
                    </div>
                  </dl>
                  <button
                    onClick={() => handleDelete(block.id)}
                    disabled={deletingId === block.id}
                    className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === block.id ? "Eliminando…" : "Eliminar bloqueo"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
