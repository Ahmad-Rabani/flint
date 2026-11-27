export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Order } from "@/models/Order";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderActions } from "./order-actions";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  await requireAdminSession("orders.view");
  const { id } = await params;
  await connection();
  await connectToDatabase();

  const doc = await Order.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) notFound();

  const order = {
    id: String(doc._id),
    orderNumber: doc.orderNumber,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    paymentMethod: doc.paymentMethod ?? null,
    total: doc.total,
    subtotal: doc.subtotal,
    discountAmount: doc.discountAmount ?? 0,
    taxAmount: doc.taxAmount ?? 0,
    shippingAmount: doc.shippingAmount ?? 0,
    currency: doc.currency ?? "USD",
    guestEmail: doc.guestEmail ?? null,
    couponCode: doc.couponCode ?? null,
    notes: doc.notes ?? null,
    internalNotes: doc.internalNotes ?? null,
    source: doc.source,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (doc.items as any[]).map((item: any) => ({
      name: item.name,
      sku: item.sku,
      imageUrl: item.imageUrl ?? null,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    shippingAddress: doc.shippingAddress
      ? {
          fullName: doc.shippingAddress.fullName,
          line1: doc.shippingAddress.line1,
          line2: doc.shippingAddress.line2 ?? null,
          city: doc.shippingAddress.city,
          state: doc.shippingAddress.state ?? null,
          postalCode: doc.shippingAddress.postalCode,
          country: doc.shippingAddress.country,
          phone: doc.shippingAddress.phone,
        }
      : null,
    createdAt: doc.createdAt ? new Date(String(doc.createdAt)).toISOString() : "",
  };

  return (
    <div>
      <Link href="/admin/orders" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Orders</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Order</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-[#171717]/50">{formatDate(order.createdAt)} · {order.source}</p>
        </div>
        <span className="border border-[#171717]/20 px-3 py-1.5 text-xs capitalize text-[#171717]/60">
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Items */}
          <Section title="Items">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#171717]/10">
                  <th className="pb-2 text-left text-xs font-normal text-[#171717]/40">Product</th>
                  <th className="pb-2 text-right text-xs font-normal text-[#171717]/40">Unit</th>
                  <th className="pb-2 text-right text-xs font-normal text-[#171717]/40">Qty</th>
                  <th className="pb-2 text-right text-xs font-normal text-[#171717]/40">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171717]/5">
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3">
                      <p className="text-[#171717] font-medium">{item.name}</p>
                      <p className="font-mono text-xs text-[#171717]/40">{item.sku}</p>
                    </td>
                    <td className="py-3 text-right text-[#171717]/60">{formatCurrency(item.unitPrice, order.currency)}</td>
                    <td className="py-3 text-right text-[#171717]/60">{item.quantity}</td>
                    <td className="py-3 text-right text-[#171717] font-medium">{formatCurrency(item.lineTotal, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Section>

          {/* Totals */}
          <Section title="Totals">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#171717]/50">Subtotal</dt>
                <dd className="text-[#171717]">{formatCurrency(order.subtotal, order.currency)}</dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[#171717]/50">Discount {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd className="text-green-600">-{formatCurrency(order.discountAmount, order.currency)}</dd>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[#171717]/50">Tax</dt>
                  <dd className="text-[#171717]">{formatCurrency(order.taxAmount, order.currency)}</dd>
                </div>
              )}
              {order.shippingAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-[#171717]/50">Shipping</dt>
                  <dd className="text-[#171717]">{formatCurrency(order.shippingAmount, order.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-[#171717]/10 pt-2 font-medium">
                <dt className="text-[#171717]">Total</dt>
                <dd className="text-[#171717]">{formatCurrency(order.total, order.currency)}</dd>
              </div>
            </dl>
          </Section>

          {/* Shipping address */}
          {order.shippingAddress && (
            <Section title="Shipping Address">
              <address className="not-italic text-sm text-[#171717]/70 space-y-0.5">
                <p className="font-medium text-[#171717]">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}{order.shippingAddress.state && `, ${order.shippingAddress.state}`} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
              </address>
            </Section>
          )}

          {order.notes && (
            <Section title="Customer Notes">
              <p className="text-sm text-[#171717]/70">{order.notes}</p>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <OrderActions
            orderId={order.id}
            currentStatus={order.status}
            currentPaymentStatus={order.paymentStatus}
            internalNotes={order.internalNotes ?? undefined}
          />
          <Section title="Customer">
            <dl className="space-y-2 text-sm">
              {order.guestEmail && (
                <div>
                  <dt className="text-xs text-[#171717]/40">Email</dt>
                  <dd className="text-[#171717]">{order.guestEmail}</dd>
                </div>
              )}
              {order.paymentMethod && (
                <div>
                  <dt className="text-xs text-[#171717]/40">Payment Method</dt>
                  <dd className="capitalize text-[#171717]">{order.paymentMethod}</dd>
                </div>
              )}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#171717]/10 bg-white p-5">
      <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-[#171717]/40">{title}</h3>
      {children}
    </div>
  );
}
