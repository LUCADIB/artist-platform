import { createSupabaseServerClient } from "../../../lib/supabaseClient";
import Link from "next/link";

export default async function ManagerOverviewPage() {
  const supabase = await createSupabaseServerClient();

  // Fetch counts only — no full data sets needed on the overview
  const [
    { count: requestCount },
    { count: artistCount },
    { count: blockCount },
  ] = await Promise.all([
    supabase.from("booking_requests").select("*", { count: "exact", head: true }),
    supabase.from("artists").select("*", { count: "exact", head: true }),
    supabase.from("availability").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Solicitudes de reserva",
      value: requestCount ?? 0,
      href: "/dashboard/manager/requests",
      linkLabel: "Ver solicitudes",
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      label: "Artistas registrados",
      value: artistCount ?? 0,
      href: "/dashboard/manager/artists",
      linkLabel: "Gestionar artistas",
      color: "text-violet-600",
      bg: "bg-violet-50",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Bloqueos de disponibilidad",
      value: blockCount ?? 0,
      href: "/dashboard/manager/availability",
      linkLabel: "Ver disponibilidad",
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          Bienvenido al panel
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Aquí tienes un resumen rápido de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-600">{stat.label}</p>
              <span className={`rounded-lg p-2 ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${stat.color}`}>
              {stat.value}
            </p>
            <Link
              href={stat.href}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-800 hover:underline"
            >
              {stat.linkLabel} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
