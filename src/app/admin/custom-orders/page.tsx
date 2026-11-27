import Link from "next/link";
import { getAllCustomOrders } from "@/features/custom-orders/queries";
import { requireAdminSession } from "@/lib/auth/admin";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  submitted: "text-blue-400",
  under_review: "text-yellow-400",
  more_info_required: "text-orange-400",
  quotation_sent: "text-copper",
  awaiting_customer_approval: "text-copper",
  approved: "text-green-400",
  payment_pending: "text-orange-400",
  confirmed: "text-green-400",
  in_progress: "text-blue-400",
  quality_check: "text-purple-400",
  ready: "text-green-500",
  shipped: "text-sky-400",
  completed: "text-emerald-400",
  cancelled: "text-red-400",
};

export default async function AdminCustomOrdersPage() {
  await requireAdminSession("custom_orders.view");

  const orders = await getAllCustomOrders().catch(() => []);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper">Admin</p>
      <h1 className="mt-2 font-heading text-4xl text-ivory">Custom Orders</h1>
      <p className="mt-2 text-sm text-white/40">{orders.length} total commission requests</p>

      <div className="mt-10 overflow-x-auto">
        {orders.length === 0 ? (
          <div className="border border-white/10 p-12 text-center text-sm text-white/30">
            No custom order requests yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 pr-6 text-xs uppercase tracking-widest text-white/30 font-normal">
                  Order
                </th>
                <th className="pb-3 pr-6 text-xs uppercase tracking-widest text-white/30 font-normal">
                  Customer
                </th>
                <th className="pb-3 pr-6 text-xs uppercase tracking-widest text-white/30 font-normal">
                  Type
                </th>
                <th className="pb-3 pr-6 text-xs uppercase tracking-widest text-white/30 font-normal">
                  Status
                </th>
                <th className="pb-3 pr-6 text-xs uppercase tracking-widest text-white/30 font-normal">
                  Date
                </th>
                <th className="pb-3 text-xs uppercase tracking-widest text-white/30 font-normal" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((order) => (
                <tr key={order.id} className="group">
                  <td className="py-4 pr-6">
                    <Link
                      href={`/admin/custom-orders/${order.id}`}
                      className="font-medium text-ivory hover:text-copper transition-colors"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-4 pr-6">
                    <p className="text-ivory">{order.customerName}</p>
                    <p className="text-xs text-white/35">{order.customerEmail}</p>
                  </td>
                  <td className="py-4 pr-6 capitalize text-white/60">{order.productType}</td>
                  <td className="py-4 pr-6">
                    <span
                      className={`text-xs capitalize ${STATUS_COLORS[order.status] ?? "text-white/40"}`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-4 pr-6 text-white/40">
                    {order.createdAt ? formatDate(order.createdAt) : "—"}
                  </td>
                  <td className="py-4">
                    <Link
                      href={`/admin/custom-orders/${order.id}`}
                      className="text-xs text-copper/60 hover:text-copper transition-colors"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
