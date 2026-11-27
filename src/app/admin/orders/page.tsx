export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Order } from "@/models/Order";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  awaiting_payment: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

type Props = {
  searchParams: Promise<{ status?: string; source?: string; page?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdminSession("orders.view");
  const sp = await searchParams;
  const status = sp.status ?? "";
  const source = sp.source ?? "all";
  const page = Number(sp.page ?? "1");
  const pageSize = 30;

  await connection();
  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { deletedAt: null };
  if (source && source !== "all") filter.source = source;
  if (status) filter.status = status;

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const items = docs.map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    total: o.total,
    currency: o.currency ?? "USD",
    guestEmail: o.guestEmail ?? null,
    source: o.source,
    createdAt: o.createdAt ? new Date(String(o.createdAt)).toISOString() : "",
  }));

  const statuses = [
    "",
    "pending",
    "awaiting_payment",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "completed",
    "cancelled",
  ];
  const sources = [
    { value: "all", label: "All sources" },
    { value: "online", label: "Online checkout" },
    { value: "pos", label: "POS" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Orders</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Orders</h1>
          <p className="mt-1 text-sm text-[#171717]/50">
            {total} total · checkout orders appear here as soon as a customer places one
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {sources.map((s) => (
          <Link
            key={s.value}
            href={`/admin/orders?source=${s.value}${status ? `&status=${status}` : ""}`}
            className={cn(
              "border px-3 py-1.5 text-sm transition-colors",
              source === s.value
                ? "border-[#171717] bg-[#171717] text-ivory"
                : "border-[#171717]/20 text-[#171717]/60 hover:border-copper hover:text-copper",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s || "all"}
            href={`/admin/orders?source=${source}${s ? `&status=${s}` : ""}`}
            className={cn(
              "border px-3 py-1.5 text-sm transition-colors capitalize",
              status === s
                ? "border-copper bg-copper/10 text-copper"
                : "border-[#171717]/20 text-[#171717]/60 hover:border-copper hover:text-copper"
            )}
          >
            {s ? s.replace(/_/g, " ") : "All statuses"}
          </Link>
        ))}
      </div>

      <div className="mt-5 border border-[#171717]/10 bg-white overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[#171717]/45">No orders yet.</p>
            <p className="mt-2 text-xs text-[#171717]/35">
              Place a test order from the storefront checkout — it will show here automatically.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Order</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Customer</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Status</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Payment</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40">Total</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Date</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {items.map((order) => (
                <tr key={order.id} className="hover:bg-[#171717]/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-[#171717] hover:text-copper transition-colors">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#171717]/60 text-xs">{order.guestEmail ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-sm px-2 py-0.5 text-xs capitalize", STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600")}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-[#171717]/60">{order.paymentStatus}</td>
                  <td className="px-4 py-3 text-right text-[#171717] font-medium">{formatCurrency(order.total, order.currency)}</td>
                  <td className="px-4 py-3 text-xs text-[#171717]/40">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${order.id}`} className="text-xs text-copper/60 hover:text-copper transition-colors">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?source=${source}${status ? `&status=${status}` : ""}&page=${p}`}
              className={cn(
                "border px-3 py-1.5 text-sm transition-colors",
                p === page ? "border-[#171717] bg-[#171717] text-ivory" : "border-[#171717]/20 text-[#171717]/60 hover:border-copper hover:text-copper"
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
