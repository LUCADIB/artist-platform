"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  isToday,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowserClient";
import { TimeSlotList, TimeSlot } from "./TimeSlotList";

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Hourly slots: 08:00 → 23:00, then wraps to 00:00 → 04:00 (covers nightlife)
const SLOT_TEMPLATES = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
  "23:00", "00:00", "01:00", "02:00", "03:00",
  "04:00",
];

const BLOCKED_STATUSES = ["blocked", "reserved", "unavailable"];
const DAY_NAMES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface AvailabilityRow {
  date: string;
  start_time: string;
  status: string;
}

interface AvailabilityPickerProps {
  artistId: string;
  onChange: (date: string, time: string) => void;
  value: string;
  timeValue: string;
}

// ────────────────────────────────────────────
// Calendar helpers
// ────────────────────────────────────────────

function getCalendarDays(month: Date): (Date | null)[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const leadingPad = getDay(start);
  return [...Array<null>(leadingPad).fill(null), ...days];
}

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export function AvailabilityPicker({
  artistId,
  onChange,
  value,
  timeValue,
}: AvailabilityPickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value + "T00:00:00") : null
  );
  const [selectedTime, setSelectedTime] = useState(timeValue || "");

  // FIX 3: Use a ref for the fetched-months set so fetchMonth never has a
  // stale closure — reading from a ref is always current.
  const fetchedMonthsRef = useRef<Set<string>>(new Set());

  // Availability cache: "YYYY-MM-DD" → rows for that date
  const [availabilityCache, setAvailabilityCache] = useState<
    Record<string, AvailabilityRow[]>
  >({});

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Close on outside click ───────────────────
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ── Fetch entire month's availability (idempotent) ───
  // FIX 3: fetchedMonthsRef removes the need for fetchedMonths in deps,
  // preventing stale closures and redundant re-renders.
  const fetchMonth = useCallback(
    async (month: Date) => {
      const key = format(month, "yyyy-MM");
      if (fetchedMonthsRef.current.has(key)) return;

      const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("availability")
        .select("date, start_time, status")
        .eq("artist_id", artistId)
        .gte("date", monthStart)
        .lte("date", monthEnd);

      if (error) {
        console.error("Availability fetch error:", error);
        return;
      }

      // Mark the month as fetched BEFORE updating cache so concurrent calls
      // don't double-fetch
      fetchedMonthsRef.current.add(key);

      const rows = (data as AvailabilityRow[]) ?? [];

      // Group by date
      const grouped: Record<string, AvailabilityRow[]> = {};
      for (const row of rows) {
        if (!grouped[row.date]) grouped[row.date] = [];
        grouped[row.date].push(row);
      }

      setAvailabilityCache((prev) => ({ ...prev, ...grouped }));
    },
    [artistId]
  );

  // Fetch when modal opens or month changes
  useEffect(() => {
    if (open) fetchMonth(viewMonth);
  }, [open, viewMonth, fetchMonth]);

  // ── Rebuild slots whenever selected date or cache changes ──
  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const dayRows = availabilityCache[dateStr] ?? [];

    const blockedRows = dayRows.filter((r) =>
      BLOCKED_STATUSES.includes(r.status)
    );

    setSlots(
      SLOT_TEMPLATES.map((time) => {
        const slotMins = timeToMinutes(time);
        const conflict = blockedRows.some((row) => {
          // Normalise "HH:MM:SS" → "HH:MM" before parsing
          const rawTime = row.start_time.slice(0, 5);
          return Math.abs(slotMins - timeToMinutes(rawTime)) < 60;
        });
        return { time, available: !conflict };
      })
    );
  }, [selectedDate, availabilityCache]);

  // ── Click a calendar day ─────────────────────
  const handleDateClick = useCallback(
    async (day: Date) => {
      setSelectedDate(day);
      setSelectedTime("");

      const monthKey = format(day, "yyyy-MM");
      if (!fetchedMonthsRef.current.has(monthKey)) {
        setLoadingSlots(true);
        await fetchMonth(day);
        setLoadingSlots(false);
      }
    },
    [fetchMonth]
  );

  // ── Select a time slot → close modal ─────────
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      onChange(format(selectedDate, "yyyy-MM-dd"), time);
      setOpen(false);
    }
  };

  // ── Derived values ───────────────────────────
  const calendarDays = getCalendarDays(viewMonth);
  const today = new Date();

  function dateHasBlocks(day: Date): boolean {
    const dateStr = format(day, "yyyy-MM-dd");
    const rows = availabilityCache[dateStr] ?? [];
    return rows.some((r) => BLOCKED_STATUSES.includes(r.status));
  }

  const displayValue =
    value && timeValue
      ? `${format(new Date(value + "T00:00:00"), "d MMM yyyy", { locale: es })} — ${timeValue}`
      : value
        ? format(new Date(value + "T00:00:00"), "d MMM yyyy", { locale: es })
        : "";

  return (
    // FIX 1: outer wrapper is relative so the fixed panel is anchored; the
    // panel itself uses fixed + translate centering to avoid viewport overflow.
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        id="availability-picker-trigger"
        onClick={() => setOpen((v) => !v)}
        className={`input flex w-full items-center justify-between gap-2 text-left ${open ? "border-primary-500 ring-1 ring-primary-500" : ""
          }`}
      >
        <span className={displayValue ? "text-neutral-900" : "text-neutral-400"}>
          {displayValue || "Seleccionar fecha y hora"}
        </span>
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* ── Dropdown panel ────────────────────────────────────────────── */}
      {open && (
        <>
          {/* FIX 1: Semi-transparent backdrop on mobile only */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/*
            FIX 1 — desktop: absolute, constrained to max-w + right-0 fallback
            so panel never spills beyond viewport. Uses left-0 but also sets
            a max-width relative to viewport, and a right boundary via right-auto.
            On mobile: full-width, appearing below the trigger as a slide-up card.
          */}
          <div
            className={[
              // Positioning
              "absolute left-1/2 -translate-x-1/2 z-50 mt-2",
              // FIX 1: width — never exceeds viewport. On sm+, cap at 680px.
              "w-[min(680px,95vw)]",
              // Prevent right-edge overflow: shift left if needed via right-0 fallback
              "sm:right-auto",
              // Visual
              "overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl",
            ].join(" ")}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
              <p className="text-sm font-semibold text-neutral-800">
                Selecciona fecha y hora
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col sm:flex-row">
              {/* ── Calendar ───────────────────────────────── */}
              <div className="flex-1 p-4">
                {/* Month navigation */}
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => subMonths(m, 1))}
                    className="rounded-full p-1.5 text-neutral-500 transition hover:bg-neutral-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="text-sm font-semibold capitalize text-neutral-800">
                    {format(viewMonth, "MMMM yyyy", { locale: es })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => addMonths(m, 1))}
                    className="rounded-full p-1.5 text-neutral-500 transition hover:bg-neutral-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Day-of-week headers */}
                <div className="mb-1 grid grid-cols-7 text-center">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="py-1 text-xs font-medium text-neutral-400">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={`pad-${idx}`} />;

                    const isPast = isBefore(day, today) && !isToday(day);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const hasBlock = dateHasBlocks(day);
                    const isCurrentMonth = isSameMonth(day, viewMonth);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={isPast}
                        onClick={() => handleDateClick(day)}
                        className={[
                          "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all",
                          isSelected
                            ? "bg-primary-600 font-semibold text-white shadow-sm"
                            : isPast
                              ? "cursor-not-allowed text-neutral-300"
                              : isToday(day)
                                ? "font-semibold text-primary-600 ring-2 ring-inset ring-primary-200"
                                : isCurrentMonth
                                  ? "text-neutral-800 hover:bg-primary-50"
                                  : "text-neutral-400 hover:bg-neutral-50",
                        ].join(" ")}
                      >
                        {format(day, "d")}

                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary-500" />
                    Seleccionado
                  </span>
                </div>
              </div>

              {/* Dividers */}
              <div className="hidden sm:block sm:w-px sm:bg-neutral-100" />
              <div className="border-t border-neutral-100 sm:hidden" />

              {/* ── Time slots ─────────────────────────────── */}
              <div className="w-full p-4 sm:w-60">
                <p className="mb-3 text-sm font-semibold text-neutral-700">
                  {selectedDate
                    ? `Horarios — ${format(selectedDate, "d MMM", { locale: es })}`
                    : "Selecciona un día"}
                </p>

                {selectedDate ? (
                  // FIX 2: relative wrapper enables the gradient fade overlay
                  <div className="relative">
                    <div className="max-h-60 overflow-y-auto pr-1">
                      <TimeSlotList
                        slots={slots}
                        selectedTime={selectedTime}
                        onSelect={handleTimeSelect}
                        isLoading={loadingSlots}
                      />
                    </div>
                    {/* FIX 2: gradient fade + hint — only visible when list is scrollable */}
                    {slots.length > 5 && (
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-1 pt-8 bg-gradient-to-t from-white to-transparent">
                        <span className="text-[10px] font-medium text-neutral-400">
                          Más horarios ↓
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">
                    Elige un día en el calendario para ver los horarios disponibles.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
