"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

type BookingFormProps = {
  artistId: string;
};

export function BookingForm({ artistId }: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      artist_id: artistId,
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      event_date: formData.get("event_date") as string,
      event_time: formData.get("event_time") as string,
      city: formData.get("city") as string,
      message: formData.get("message") as string,
    };

    try {
      const supabase = getBrowserClient();
      const { error: dbError } = await supabase.from("booking_requests").insert(payload);
      if (dbError) {
        throw dbError;
      }
      setSuccess("Tu solicitud fue enviada. El manager se pondrá en contacto contigo.");
      (event.target as HTMLFormElement).reset();
    } catch (e) {
      console.error(e);
      setError("No se pudo enviar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Nombre completo
          </label>
          <input
            name="name"
            required
            placeholder="Tu nombre"
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Teléfono
          </label>
          <input
            name="phone"
            required
            placeholder="WhatsApp o teléfono"
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Fecha del evento
          </label>
          <input
            type="date"
            name="event_date"
            required
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Hora del evento
          </label>
          <input
            type="time"
            name="event_time"
            required
            className="input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Ciudad
          </label>
          <input
            name="city"
            required
            placeholder="Ciudad del evento"
            className="input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Mensaje
          </label>
          <textarea
            name="message"
            rows={4}
            placeholder="Cuéntanos sobre tu evento, horario, tipo de montaje, etc."
            className="input resize-none"
          />
        </div>
      </div>
      {success && (
        <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          {success}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar solicitud de reserva"}
      </button>
    </form>
  );
}
