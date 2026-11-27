export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { CustomOrder } from "@/models/CustomOrder";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

const ORDER_STATUS_COLORS: Record<string, string> = {
  paid: "text-green-600",
  processing: "text-blue-600",
  shipped: "text-sky-600",
  completed: "text-emerald-600",
  cancelled: "text-red-500",
  pending: "text-yellow-600",
};

export default async function CustomerDetailPage({ params }: Props) {
  await requireAdminSession("customers.view");
  const { id } = await params;
  await connection();
  await connectToDatabase();

  const doc = await Customer.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) notFound();

  const [orders, customOrders] = await Promise.all([
    Order.find({ customerId: id, deletedAt: null }).sort({ createdAt: -1 }).limit(20).lean(),
    CustomOrder.find({ customerId: id, deletedAt: null }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const customer = {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? null,
    orderCount: doc.orderCount ?? 0,
    totalSpent: doc.totalSpent ?? 0,
    notes: doc.notes ?? null,
    tags: doc.tags ?? [],
    marketingOptIn: doc.marketingOptIn ?? false,
    createdAt: doc.createdAt ? new Date(String(doc.createdAt)).toISOString() : "",
  };

  const orderItems = orders.map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    currency: o.currency ?? "USD",
    createdAt: o.createdAt ? new Date(String(o.createdAt)).toISOString() : "",
  }));

  const customOrderItems = customOrders.map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    productType: o.productType,
    status: o.status,
    createdAt: o.createdAt ? new Date(String(o.createdAt)).toISOString() : "",
  }));

  return (
    <div>
      <Link href="/admin/customers" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Customers</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Customer</p>
          <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">{customer.name}</h1>
          <p className="mt-1 text-sm text-[#1B365D]/50">{customer.email}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl text-[#1B365D]">{formatCurrency(customer.totalSpent)}</p>
          <p className="text-xs text-[#1B365D]/40">{customer.orderCount} orders</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {/* Orders */}
          <div className="border border-[#1B365D]/10 bg-white p-5">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-[#1B365D]/40">Orders</h3>
            {orderItems.length === 0 ? (
              <p className="text-sm text-[#1B365D]/30">No online orders.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1B365D]/10">
                    <th className="pb-2 text-left text-xs font-normal text-[#1B365D]/40">Order</th>
                    <th className="pb-2 text-left text-xs font-normal text-[#1B365D]/40">Status</th>
                    <th className="pb-2 text-right text-xs font-normal text-[#1B365D]/40">Total</th>
                    <th className="pb-2 text-left text-xs font-normal text-[#1B365D]/40">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B365D]/5">
                  {orderItems.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5">
                        <Link href={`/admin/orders/${o.id}`} className="text-[#1B365D] hover:text-copper transition-colors font-medium">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5">
                        <span className={cn("text-xs capitalize", ORDER_STATUS_COLORS[o.status] ?? "text-[#1B365D]/50")}>
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[#1B365D]">{formatCurrency(o.total, o.currency)}</td>
                      <td className="py-2.5 text-xs text-[#1B365D]/40">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {customOrderItems.length > 0 && (
            <div className="border border-[#1B365D]/10 bg-white p-5">
              <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-[#1B365D]/40">Custom Orders / Commissions</h3>
              <div className="space-y-3">
                {customOrderItems.map((o) => (
                  <div key={o.id} className="flex items-center justify-between">
                    <div>
                      <Link href={`/admin/custom-orders/${o.id}`} className="text-[#1B365D] hover:text-copper transition-colors font-medium text-sm">
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs capitalize text-[#1B365D]/40">{o.productType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs capitalize text-[#1B365D]/60">{o.status.replace(/_/g, " ")}</p>
                      <p className="text-xs text-[#1B365D]/30">{formatDate(o.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="border border-[#1B365D]/10 bg-white p-5 h-fit space-y-4">
          <h3 className="text-xs uppercase tracking-[0.2em] text-[#1B365D]/40">Profile</h3>
          <dl className="space-y-3 text-sm">
            {customer.phone && (
              <div>
                <dt className="text-xs text-[#1B365D]/40">Phone</dt>
                <dd className="text-[#1B365D]">{customer.phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-[#1B365D]/40">Customer Since</dt>
              <dd className="text-[#1B365D]">{formatDate(customer.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#1B365D]/40">Marketing</dt>
              <dd className={customer.marketingOptIn ? "text-green-600" : "text-[#1B365D]/30"}>
                {customer.marketingOptIn ? "Opted in" : "Opted out"}
              </dd>
            </div>
            {customer.tags.length > 0 && (
              <div>
                <dt className="text-xs text-[#1B365D]/40">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {customer.tags.map((tag: string) => (
                    <span key={tag} className="rounded-sm bg-[#1B365D]/5 px-2 py-0.5 text-xs text-[#1B365D]/60">{tag}</span>
                  ))}
                </dd>
              </div>
            )}
            {customer.notes && (
              <div>
                <dt className="text-xs text-[#1B365D]/40">Notes</dt>
                <dd className="text-[#1B365D]/60">{customer.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
