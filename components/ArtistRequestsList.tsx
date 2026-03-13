"use client";

interface BookingRequest {
  id: string;
  artist_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string | null;
  venue: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

interface ArtistRequestsListProps {
  requests: BookingRequest[];
}

export function ArtistRequestsList({ requests }: ArtistRequestsListProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-neutral-700">
          No tienes solicitudes de reserva todavía.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Las solicitudes aparecerán aquí cuando alguien quiera reservarte.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}

function RequestCard({ request }: { request: BookingRequest }) {
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    pending: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      label: "Pendiente",
    },
    confirmed: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Confirmado",
    },
    cancelled: {
      bg: "bg-neutral-100",
      text: "text-neutral-700",
      label: "Cancelado",
    },
  };

  const status = statusConfig[request.status] || statusConfig.pending;

  // Format date
  const eventDate = new Date(request.event_date).toLocaleDateString("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const createdAt = new Date(request.created_at).toLocaleDateString("es-EC", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-neutral-900">
            {request.client_name}
          </h3>
          <p className="text-sm text-neutral-500">{request.client_email}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}
        >
          {status.label}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-neutral-500">Fecha del evento</p>
          <p className="font-medium text-neutral-900 capitalize">{eventDate}</p>
        </div>

        {request.event_time && (
          <div>
            <p className="text-neutral-500">Hora</p>
            <p className="font-medium text-neutral-900">{request.event_time}</p>
          </div>
        )}

        {request.event_type && (
          <div>
            <p className="text-neutral-500">Tipo de evento</p>
            <p className="font-medium text-neutral-900">{request.event_type}</p>
          </div>
        )}

        {request.venue && (
          <div>
            <p className="text-neutral-500">Lugar</p>
            <p className="font-medium text-neutral-900">{request.venue}</p>
          </div>
        )}

        {request.client_phone && (
          <div>
            <p className="text-neutral-500">Teléfono</p>
            <p className="font-medium text-neutral-900">{request.client_phone}</p>
          </div>
        )}
      </div>

      {/* Message */}
      {request.message && (
        <div className="mt-4 rounded-lg bg-neutral-50 p-3">
          <p className="text-xs font-medium text-neutral-500 mb-1">Mensaje</p>
          <p className="text-sm text-neutral-700 whitespace-pre-line">
            {request.message}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-neutral-100">
        <p className="text-xs text-neutral-400">
          Recibido el {createdAt}
        </p>
      </div>
    </div>
  );
}
