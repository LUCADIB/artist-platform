"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowserClient";
import { AvailabilityPicker } from "./AvailabilityPicker";

interface BookingRequestFormProps {
  artistId: string;
  artistName: string;
}

/** Convert a "HH:MM" or "HH:MM:SS" string to total minutes since midnight. */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Returns true if the selected time (in minutes) falls within
 * ±60 minutes of an availability slot's start_time.
 */
function isWithinBlockedWindow(
  selectedMinutes: number,
  slotStartMinutes: number
): boolean {
  return Math.abs(selectedMinutes - slotStartMinutes) < 60;
}

export function BookingRequestForm({
  artistId,
  artistName
}: BookingRequestFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Availability state
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const checkAvailability = useCallback(async (date: string, time: string) => {
    if (!date || !time) {
      setAvailabilityError(null);
      return;
    }

    setIsCheckingAvailability(true);
    setAvailabilityError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("availability")
        .select("start_time")
        .eq("artist_id", artistId)
        .eq("date", date);

      if (error) {
        // If the query fails, do not block the user — just log
        console.error("Availability check error:", error);
        return;
      }

      // Safely handle empty results
      if (!data || data.length === 0) {
        setAvailabilityError(null);
        return;
      }

      const selectedMinutes = timeToMinutes(time);
      const conflict = data.some((slot: { start_time: string }) =>
        isWithinBlockedWindow(selectedMinutes, timeToMinutes(slot.start_time))
      );

      if (conflict) {
        setAvailabilityError("Este horario no está disponible.");
      } else {
        setAvailabilityError(null);
      }
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [artistId]);

  // Re-check whenever date or time changes
  useEffect(() => {
    checkAvailability(eventDate, eventTime);
  }, [eventDate, eventTime, checkAvailability]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Guard: do not submit if time is blocked
    if (availabilityError) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/booking-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          artistId,
          name,
          phone,
          eventDate,
          eventTime,
          city,
          message
        })
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setSuccessMessage(
        "Tu solicitud fue enviada correctamente. Nos pondremos en contacto contigo pronto."
      );
      setName("");
      setPhone("");
      setEventDate("");
      setEventTime("");
      setCity("");
      setMessage("");
    } catch (error) {
      setErrorMessage(
        "Hubo un problema al enviar tu solicitud. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isTimeBlocked = Boolean(availabilityError);
  const isSubmitDisabled = isSubmitting || isCheckingAvailability || isTimeBlocked;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
      <h2 className="mb-1 text-base font-semibold text-neutral-900 sm:text-lg">
        Solicitar reserva
      </h2>
      <p className="mb-4 text-xs text-neutral-600 sm:text-sm">
        Completa el formulario para solicitar una reserva con {artistName}.
      </p>
      <p className="mb-4 mt-1 text-xs font-semibold text-neutral-800 sm:text-sm">
        Aquí puedes ver fechas y horarios disponibles de {artistName}.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="booking-name"
              className="text-xs font-medium text-neutral-700"
            >
              Nombre completo
            </label>
            <input
              id="booking-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="booking-phone"
              className="text-xs font-medium text-neutral-700"
            >
              Teléfono de contacto
            </label>
            <input
              id="booking-phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 099 123 4567"
              required
            />
          </div>
        </div>

        {/* ── Availability Picker (replaces date + time inputs) ── */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="availability-picker-trigger"
            className="text-xs font-medium text-neutral-700"
          >
            Fecha del evento y hora aproximada
          </label>
          <AvailabilityPicker
            artistId={artistId}
            value={eventDate}
            timeValue={eventTime}
            onChange={(date, time) => {
              setEventDate(date);
              setEventTime(time);
            }}
          />
          {isCheckingAvailability && (
            <p className="text-xs text-neutral-400">Verificando disponibilidad...</p>
          )}
          {availabilityError && !isCheckingAvailability && (
            <p className="text-xs text-red-600">{availabilityError}</p>
          )}
          {/* Hidden required inputs so form validation still works */}
          <input type="hidden" name="eventDate" value={eventDate} required />
          <input type="hidden" name="eventTime" value={eventTime} required />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="booking-city"
            className="text-xs font-medium text-neutral-700"
          >
            Ciudad del evento
          </label>
          <input
            id="booking-city"
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ciudad"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="booking-message"
            className="text-xs font-medium text-neutral-700"
          >
            Detalles del evento
          </label>
          <textarea
            id="booking-message"
            className="input min-h-[96px] resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntanos más sobre tu evento, tipo de show, duración estimada, etc."
          />
        </div>

        {successMessage && (
          <p className="text-xs text-emerald-600 sm:text-sm">
            {successMessage}
          </p>
        )}
        {errorMessage && (
          <p className="text-xs text-red-600 sm:text-sm">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary mt-1 w-full sm:w-auto"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? "Enviando..." : "Enviar solicitud"}
        </button>
        <a
          href={`https://wa.me/593993737070?text=${encodeURIComponent(
            `Hola, quiero información sobre ${artistName}`
          )}`}
          target="_blank"
          className="mt-3 block text-center text-sm text-primary-600 underline hover:text-primary-700"
        >
          ¿Prefieres hablar directo? Contactar Manager
        </a>
      </form>
    </div>
  );
}
