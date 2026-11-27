export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Quotation } from "@/models/Quotation";
import { CustomOrder } from "@/models/CustomOrder";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  expired: "bg-orange-100 text-orange-600",
};

export default async function AdminQuotationsPage() {
  await requireAdminSession("quotations.manage");
  await connection();
  await connectToDatabase();

  const docs = await Quotation.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();

  const orderIds = [...new Set(docs.map((d) => String(d.customOrderId)))];
  const orders = await CustomOrder.find({ _id: { $in: orderIds } }).select("_id orderNumber customerName").lean();
  const orderMap: Record<string, { orderNumber: string; customerName: string }> = {};
  orders.forEach((o) => { orderMap[String(o._id)] = { orderNumber: o.orderNumber, customerName: o.customerName }; });

  const items = docs.map((d) => ({
    id: String(d._id),
    quotationNumber: d.quotationNumber,
    customOrderId: String(d.customOrderId),
    amount: d.amount,
    currency: d.currency ?? "USD",
    depositAmount: d.depositAmount ?? 0,
    validUntil: d.validUntil ? new Date(String(d.validUntil)).toISOString() : null,
    status: d.status,
    sentAt: d.sentAt ? new Date(String(d.sentAt)).toISOString() : null,
    createdAt: d.createdAt ? new Date(String(d.createdAt)).toISOString() : "",
    order: orderMap[String(d.customOrderId)] ?? null,
  }));

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Orders</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">Quotations</h1>
      <p className="mt-1 text-sm text-[#171717]/50">{items.length} total</p>

      <div className="mt-6 border border-[#171717]/10 bg-white overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/30">
            No quotations yet. Issue them from Custom Order pages.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Quotation #</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Custom Order</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Customer</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40">Amount</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Status</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Valid Until</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {items.map((q) => (
                <tr key={q.id} className="hover:bg-[#171717]/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#171717]">{q.quotationNumber}</td>
                  <td className="px-4 py-3">
                    {q.order ? (
                      <Link href={`/admin/custom-orders/${q.customOrderId}`} className="text-copper/70 hover:text-copper transition-colors">
                        {q.order.orderNumber}
                      </Link>
                    ) : (
                      <span className="text-[#171717]/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#171717]/60">{q.order?.customerName ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-[#171717] font-medium">
                    {formatCurrency(q.amount, q.currency)}
                    {q.depositAmount > 0 && (
                      <p className="text-xs font-normal text-[#171717]/40">Deposit: {formatCurrency(q.depositAmount, q.currency)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-sm px-2 py-0.5 text-xs capitalize", STATUS_COLORS[q.status] ?? "bg-gray-100 text-gray-600")}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#171717]/40">{q.validUntil ? formatDate(q.validUntil) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/custom-orders/${q.customOrderId}`} className="text-xs text-copper/60 hover:text-copper transition-colors">
                      View →
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
