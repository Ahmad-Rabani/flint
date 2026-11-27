export const instant = false;

import Link from "next/link";
import { getAllCustomOrders } from "@/features/custom-orders/queries";
import { requireAdminSession } from "@/lib/auth/admin";
import { formatDate, cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  more_info_required: "bg-orange-100 text-orange-800",
  quotation_sent: "bg-copper/15 text-copper",
  awaiting_customer_approval: "bg-copper/15 text-copper",
  approved: "bg-green-100 text-green-800",
  payment_pending: "bg-orange-100 text-orange-800",
  confirmed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  quality_check: "bg-violet-100 text-violet-800",
  ready: "bg-emerald-100 text-emerald-800",
  shipped: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};

export default async function AdminCustomOrdersPage() {
  await requireAdminSession("custom_orders.view");

  const orders = await getAllCustomOrders().catch(() => []);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Orders</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Custom Orders</h1>
      <p className="mt-2 text-sm text-[#1B365D]/55">{orders.length} commission requests</p>

      <div className="mt-8 overflow-x-auto border border-[#1B365D]/10 bg-white">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#1B365D]/40">
            No custom order requests yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1B365D]/10 text-left">
                <th className="px-4 pb-3 pt-4 text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">
                  Order
                </th>
                <th className="px-4 pb-3 pt-4 text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">
                  Customer
                </th>
                <th className="px-4 pb-3 pt-4 text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">
                  Type
                </th>
                <th className="px-4 pb-3 pt-4 text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">
                  Status
                </th>
                <th className="px-4 pb-3 pt-4 text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">
                  Date
                </th>
                <th className="px-4 pb-3 pt-4 text-xs uppercase tracking-widest font-normal text-[#1B365D]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B365D]/5">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#1B365D]/[0.02]">
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/custom-orders/${order.id}`}
                      className="font-medium text-[#1B365D] hover:text-copper transition-colors"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[#1B365D]">{order.customerName}</p>
                    <p className="text-xs text-[#1B365D]/45">{order.customerEmail}</p>
                  </td>
                  <td className="px-4 py-4 capitalize text-[#1B365D]/65">{order.productType}</td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-xs capitalize",
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600",
                      )}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-[#1B365D]/45">
                    {order.createdAt ? formatDate(order.createdAt) : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/custom-orders/${order.id}`}
                      className="text-xs text-copper hover:text-copper/80 transition-colors"
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
