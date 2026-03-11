import { ManagerSidebar } from "../../../components/ManagerSidebar";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <ManagerSidebar />

      {/* Main content — offset right of the sidebar on desktop, padded top on mobile for the fixed top bar */}
      <main className="pt-14 md:ml-64 md:pt-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
