"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "pending" | "contacted" | "confirmed";

interface BookingStatusButtonsProps {
  requestId: string;
  currentStatus: Status;
}

export function BookingStatusButtons({
  requestId,
  currentStatus,
}: BookingStatusButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(newStatus: Status) {
    setLoading(newStatus);
    try {
      await fetch(`/api/booking-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
      <button
        onClick={() => updateStatus("contacted")}
        disabled={currentStatus === "contacted" || currentStatus === "confirmed" || loading !== null}
        className="rounded-md border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading === "contacted" ? "Actualizando…" : "Marcar como contactado"}
      </button>
      <button
        onClick={() => updateStatus("confirmed")}
        disabled={currentStatus === "confirmed" || loading !== null}
        className="rounded-md border border-emerald-400 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading === "confirmed" ? "Actualizando…" : "Marcar como confirmado"}
      </button>
    </div>
  );
}
