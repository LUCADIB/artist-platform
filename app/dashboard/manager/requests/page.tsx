import { createSupabaseServerClient } from "../../../../lib/supabaseClient";
import { BookingStatusButtons } from "../../../../components/BookingStatusButtons";

type Status = "pending" | "contacted" | "confirmed";

interface BookingRequest {
  id: string;
  client_name: string;
  client_phone: string;
  event_date: string;
  event_time: string;
  city: string;
  status: Status;
  created_at: string;
  artists: { id: string; name: string; managed_by_admin: boolean } | null;
}

const StatusBadge = ({ status }: { status: Status }) => {
  const styles: Record<Status, string> = {
    pending: "bg-neutral-100 text-neutral-600 border-neutral-300",
    contacted: "bg-amber-50 text-amber-700 border-amber-300",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-300",
  };
  const labels: Record<Status, string> = {
    pending: "Pendiente",
    contacted: "Contactado",
    confirmed: "Confirmado",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default async function RequestsPage() {
  const supabase = await createSupabaseServerClient();

  // Get current user and check role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const role = profile?.role as string | undefined;
  const isAdmin = role === "admin";
  const isManager = role === "manager";

  // Admin sees all requests, Manager sees only requests for artists they manage
  let requestsQuery = supabase
    .from("booking_requests")
    .select(
      "id, client_name, client_phone, event_date, event_time, city, status, created_at, artists ( id, name, managed_by_admin )"
    )
    .order("created_at", { ascending: false });

  // If manager (not admin), filter to only show requests for managed artists
  if (isManager && !isAdmin) {
    // Get IDs of artists managed by this manager
    const { data: managedArtists } = await supabase
      .from("artists")
      .select("id")
      .eq("managed_by_admin", true);

    const managedArtistIds = (managedArtists ?? []).map((a) => a.id);

    if (managedArtistIds.length > 0) {
      requestsQuery = requestsQuery.in("artist_id", managedArtistIds);
    } else {
      // No managed artists, return empty
      const bookings: BookingRequest[] = [];
      return (
        <div>
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
              Solicitudes de reserva
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Gestiona y actualiza el estado de cada solicitud.
            </p>
          </div>
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white">
            <p className="text-sm text-neutral-400">No hay solicitudes todavía.</p>
          </div>
        </div>
      );
    }
  }

  const { data: requests } = await requestsQuery;

  const bookings = (requests ?? []) as unknown as BookingRequest[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          Solicitudes de reserva
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestiona y actualiza el estado de cada solicitud.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white">
          <p className="text-sm text-neutral-400">No hay solicitudes todavía.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  {[
                    "Artista",
                    "Cliente",
                    "Teléfono",
                    "Fecha",
                    "Hora",
                    "Ciudad",
                    "Estado",
                    "Acciones",
                  ].map((col) => (
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
                {bookings.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {booking.artists?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{booking.client_name}</td>
                    <td className="px-4 py-3 text-neutral-700">{booking.client_phone}</td>
                    <td className="px-4 py-3 text-neutral-700">{booking.event_date}</td>
                    <td className="px-4 py-3 text-neutral-700">{booking.event_time}</td>
                    <td className="px-4 py-3 text-neutral-700">{booking.city}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusButtons
                        requestId={booking.id}
                        currentStatus={booking.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border-b border-neutral-100 px-4 py-5 last:border-b-0"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {booking.artists?.name ?? "—"}
                    </p>
                    <p className="text-xs text-neutral-500">{booking.client_name}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="font-medium text-neutral-400">Teléfono</dt>
                    <dd className="text-neutral-700">{booking.client_phone}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-neutral-400">Ciudad</dt>
                    <dd className="text-neutral-700">{booking.city}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-neutral-400">Fecha</dt>
                    <dd className="text-neutral-700">{booking.event_date}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-neutral-400">Hora</dt>
                    <dd className="text-neutral-700">{booking.event_time}</dd>
                  </div>
                </dl>
                <BookingStatusButtons
                  requestId={booking.id}
                  currentStatus={booking.status}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
