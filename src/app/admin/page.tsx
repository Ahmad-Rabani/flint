import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper">Admin</p>
      <h1 className="mt-2 font-heading text-4xl text-ivory">Dashboard</h1>
      <p className="mt-3 text-sm text-white/40">
        Welcome to the FLINT atelier admin. Select a section from the sidebar.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/custom-orders"
          className="flex flex-col border border-white/10 bg-white/5 p-6 transition-colors hover:border-copper/40 hover:bg-copper/5"
        >
          <span className="text-2xl text-copper">⚙</span>
          <span className="mt-4 font-heading text-xl text-ivory">Custom Orders</span>
          <span className="mt-2 text-xs text-white/40">
            Review commissions, update status, issue quotations.
          </span>
        </Link>
      </div>
    </div>
  );
}
