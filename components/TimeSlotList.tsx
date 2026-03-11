"use client";

import clsx from "clsx";

export interface TimeSlot {
  time: string; // "HH:MM" — always 24-hour format
  available: boolean;
}

/**
 * Returns a zero-padded 24-hour label ("HH:MM") for a slot string.
 * E.g. "8:00" → "08:00", "20:00" → "20:00".
 */
function formatSlotTime(time: string): string {
  const [h, m] = time.split(":");
  return `${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`;
}

interface TimeSlotListProps {
  slots: TimeSlot[];
  selectedTime: string;
  onSelect: (time: string) => void;
  isLoading: boolean;
}

export function TimeSlotList({
  slots,
  selectedTime,
  onSelect,
  isLoading,
}: TimeSlotListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg bg-neutral-100"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-neutral-400">
        No hay horarios disponibles para este día.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {slots.map(({ time, available }) => {
        const isSelected = time === selectedTime;
        return (
          <button
            key={time}
            type="button"
            disabled={!available}
            onClick={() => available && onSelect(time)}
            className={clsx(
              "flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
              isSelected
                ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                : available
                  ? "border-neutral-200 bg-white text-neutral-800 hover:border-primary-300 hover:bg-primary-50/40"
                  : "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300"
            )}
          >
            <span>{formatSlotTime(time)}</span>
            {isSelected ? (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                ✓ Seleccionado
              </span>
            ) : (
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs",
                  available
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-neutral-100 text-neutral-400"
                )}
              >
                {available ? "disponible" : "ocupado"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
