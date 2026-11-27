export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCustomerCustomOrders } from "@/features/custom-orders/queries";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  more_info_required: "Info Needed",
  quotation_sent: "Quotation Sent",
  awaiting_customer_approval: "Awaiting Your Approval",
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

const STATUS_COLORS: Record<string, string> = {
  submitted: "text-blue-400 bg-blue-400/10",
  under_review: "text-yellow-400 bg-yellow-400/10",
  more_info_required: "text-orange-400 bg-orange-400/10",
  quotation_sent: "text-copper bg-copper/10",
  awaiting_customer_approval: "text-copper bg-copper/10",
  approved: "text-green-400 bg-green-400/10",
  payment_pending: "text-orange-400 bg-orange-400/10",
  confirmed: "text-green-400 bg-green-400/10",
  in_progress: "text-blue-400 bg-blue-400/10",
  quality_check: "text-purple-400 bg-purple-400/10",
  ready: "text-green-500 bg-green-500/10",
  shipped: "text-sky-400 bg-sky-400/10",
  completed: "text-emerald-400 bg-emerald-400/10",
  cancelled: "text-red-400 bg-red-400/10",
};

export default async function AccountCustomOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/custom-orders");

  const orders = await getCustomerCustomOrders(session).catch(() => []);

  return (
    <div className="border border-border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl text-ink">Custom commissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track quotations and forge progress for your bespoke blades.
          </p>
        </div>
        <Link
          href="/custom"
          className="inline-flex h-11 items-center bg-copper px-5 text-xs uppercase tracking-[0.2em] text-white hover:bg-copper/90 transition-colors"
        >
          + New commission
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 border border-dashed border-border px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">No custom commissions yet.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Design a unique blade crafted exactly to your vision.
          </p>
          <Link
            href="/custom"
            className="mt-6 inline-flex h-11 items-center bg-copper px-5 text-xs uppercase tracking-[0.2em] text-white hover:bg-copper/90 transition-colors"
          >
            Start custom design
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border">
          {orders.map((order) => (
            <li key={order.id} className="py-5">
              <Link
                href={`/account/custom-orders/${order.orderNumber}`}
                className="group flex flex-wrap items-start justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-ink group-hover:text-copper transition-colors">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">
                    {order.productType} · {order.designStyle.replace(/_/g, " ")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.createdAt ? formatDate(order.createdAt) : "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-block rounded-sm px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? "text-muted-foreground bg-muted"}`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  {order.hasQuotation && (
                    <span className="text-xs text-copper">Quotation available →</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
