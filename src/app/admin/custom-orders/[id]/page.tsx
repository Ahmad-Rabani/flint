export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminCustomOrderById } from "@/features/custom-orders/queries";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AdminOrderActions } from "./admin-order-actions";

type Props = {
  params: Promise<{ id: string }>;
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  more_info_required: "More Info Required",
  quotation_sent: "Quotation Sent",
  awaiting_customer_approval: "Awaiting Customer Approval",
  approved: "Approved",
  payment_pending: "Payment Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  quality_check: "Quality Check",
  ready: "Ready",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function AdminCustomOrderDetailPage({ params }: Props) {
  const { id } = await params;
  await requireAdminSession("custom_orders.view");

  const order = await getAdminCustomOrderById(id).catch(() => null);
  if (!order) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/custom-orders"
            className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors"
          >
            ← All commissions
          </Link>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-copper">Custom Order</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">{order.orderNumber}</h1>
          <p className="mt-1 text-sm capitalize text-[#171717]/45">
            {order.productType} · {order.designStyle.replace(/_/g, " ")} ·{" "}
            {order.createdAt ? formatDate(order.createdAt) : "—"}
          </p>
        </div>
        <span className="border border-copper/30 bg-copper/10 px-3 py-1.5 text-xs capitalize text-copper">
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left column — read-only details */}
        <div className="space-y-6">
          {/* Customer */}
          <Section title="Customer">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[#171717]/45">Name</dt>
                <dd className="mt-1 text-[#171717]">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-[#171717]/45">Email</dt>
                <dd className="mt-1 break-all text-[#171717]">{order.customerEmail}</dd>
              </div>
              {order.customerPhone && (
                <div>
                  <dt className="text-[#171717]/45">Phone</dt>
                  <dd className="mt-1 text-[#171717]">{order.customerPhone}</dd>
                </div>
              )}
              {order.intendedUse && (
                <div>
                  <dt className="text-[#171717]/45">Intended use</dt>
                  <dd className="mt-1 text-[#171717]">{order.intendedUse}</dd>
                </div>
              )}
            </dl>
          </Section>

          {/* Vision */}
          <Section title="Vision">
            <p className="text-sm leading-relaxed text-[#171717]/80">{order.description}</p>
            {order.additionalComments && (
              <p className="mt-3 text-sm leading-relaxed text-[#171717]/55">
                {order.additionalComments}
              </p>
            )}
          </Section>

          {/* Preferences */}
          {Object.keys(order.preferences).length > 0 && (
            <Section title="Specifications">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(order.preferences).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs capitalize text-[#171717]/45">{k.replace(/_/g, " ")}</dt>
                    <dd className="mt-1 capitalize text-[#171717]">{String(v).replace(/_/g, " ")}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {/* Budget */}
          {(order.budgetMin || order.budgetMax) && (
            <Section title="Budget">
              <p className="text-sm text-[#171717]">
                {order.budgetMin && formatCurrency(order.budgetMin)}
                {order.budgetMin && order.budgetMax && " – "}
                {order.budgetMax && formatCurrency(order.budgetMax)}
              </p>
            </Section>
          )}

          {/* Reference images */}
          {order.referenceImages.length > 0 && (
            <Section title={`Reference Images (${order.referenceImages.length})`}>
              <div className="grid grid-cols-4 gap-3">
                {order.referenceImages.map((img, i) => (
                  <a
                    key={i}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden border border-white/15 block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt ?? `Reference ${i + 1}`}
                      className="h-full w-full object-cover hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Status history */}
          <Section title="Status History">
            <ol className="space-y-3">
              {order.statusHistory.map((h, i) => (
                <li key={i} className="flex items-start gap-4 text-sm">
                  <span className="mt-0.5 w-32 shrink-0 text-xs capitalize text-copper/70">
                    {STATUS_LABELS[h.status] ?? h.status}
                  </span>
                  <div className="min-w-0">
                    {h.note && <p className="text-[#171717]/60">{h.note}</p>}
                    <p className="text-xs text-[#171717]/40">{h.createdAt ? formatDate(h.createdAt) : "—"}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        {/* Right column — actions */}
        <AdminOrderActions
          orderId={order.id}
          currentStatus={order.status}
          hasQuotation={order.hasQuotation}
          quotation={order.quotation ?? undefined}
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#171717]/10 bg-white p-6">
      <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-copper/80">{title}</h3>
      {children}
    </div>
  );
}
