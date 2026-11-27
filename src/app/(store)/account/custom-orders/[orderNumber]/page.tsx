import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCustomOrderByNumber } from "@/features/custom-orders/queries";
import { formatDate, formatCurrency } from "@/lib/utils";

type Props = {
  params: Promise<{ orderNumber: string }>;
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  more_info_required: "More Info Required",
  quotation_sent: "Quotation Sent",
  awaiting_customer_approval: "Awaiting Your Approval",
  approved: "Approved",
  payment_pending: "Payment Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  quality_check: "Quality Check",
  ready: "Ready to Ship",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "text-blue-600 bg-blue-50 border-blue-100",
  under_review: "text-yellow-700 bg-yellow-50 border-yellow-100",
  more_info_required: "text-orange-600 bg-orange-50 border-orange-100",
  quotation_sent: "text-copper bg-copper/5 border-copper/20",
  awaiting_customer_approval: "text-copper bg-copper/5 border-copper/20",
  approved: "text-green-700 bg-green-50 border-green-100",
  payment_pending: "text-orange-600 bg-orange-50 border-orange-100",
  confirmed: "text-green-700 bg-green-50 border-green-100",
  in_progress: "text-blue-700 bg-blue-50 border-blue-100",
  quality_check: "text-purple-700 bg-purple-50 border-purple-100",
  ready: "text-emerald-700 bg-emerald-50 border-emerald-100",
  shipped: "text-sky-700 bg-sky-50 border-sky-100",
  completed: "text-emerald-700 bg-emerald-50 border-emerald-100",
  cancelled: "text-red-600 bg-red-50 border-red-100",
};

const TIMELINE_STEPS = [
  "submitted",
  "under_review",
  "quotation_sent",
  "confirmed",
  "in_progress",
  "quality_check",
  "shipped",
  "completed",
];

export default async function AccountCustomOrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/account/custom-orders/${orderNumber}`);

  const order = await getCustomOrderByNumber(session, orderNumber).catch(() => null);
  if (!order) notFound();

  const currentStep = TIMELINE_STEPS.indexOf(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/account/custom-orders"
              className="text-xs uppercase tracking-widest text-copper hover:underline"
            >
              ← Back to commissions
            </Link>
            <h2 className="mt-3 font-heading text-2xl text-ink">{order.orderNumber}</h2>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {order.productType} · {order.designStyle.replace(/_/g, " ")} ·{" "}
              {order.createdAt ? formatDate(order.createdAt) : "—"}
            </p>
          </div>
          <span
            className={`inline-block border px-3 py-1.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "text-muted-foreground border-border"}`}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="border border-border bg-white p-6">
        <h3 className="font-heading text-base text-ink">Progress</h3>
        <div className="relative mt-6">
          <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
          <ol className="space-y-6 pl-10">
            {TIMELINE_STEPS.map((step, i) => {
              const isCompleted =
                order.statusHistory.some((h) => h.status === step) || i <= currentStep;
              const isCurrent = step === order.status;
              const historyEntry = order.statusHistory
                .filter((h) => h.status === step)
                .at(-1);
              return (
                <li key={step} className="relative">
                  <span
                    className={`absolute -left-7 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                      isCurrent
                        ? "border-copper bg-copper text-white"
                        : isCompleted
                          ? "border-copper/40 bg-copper/10 text-copper"
                          : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className={isCurrent ? "font-medium" : ""}>
                    <p className={`text-sm ${isCurrent ? "text-ink" : isCompleted ? "text-ink/70" : "text-muted-foreground"}`}>
                      {STATUS_LABELS[step] ?? step}
                    </p>
                    {historyEntry?.createdAt && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(historyEntry.createdAt)}
                        {historyEntry.note && ` · ${historyEntry.note}`}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Quotation */}
      {order.quotation && (
        <div className="border border-copper/20 bg-copper/5 p-6">
          <h3 className="font-heading text-base text-ink">Your Quotation</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Quotation number</p>
              <p className="mt-1 font-medium text-ink">{order.quotation.quotationNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="mt-1 font-heading text-2xl text-copper">
                {formatCurrency(order.quotation.amount, order.quotation.currency)}
              </p>
            </div>
            {order.quotation.depositAmount && order.quotation.depositAmount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Deposit required</p>
                <p className="mt-1 text-sm text-ink">
                  {formatCurrency(order.quotation.depositAmount, order.quotation.currency)}
                </p>
              </div>
            )}
            {order.quotation.estimatedDays && (
              <div>
                <p className="text-xs text-muted-foreground">Estimated lead time</p>
                <p className="mt-1 text-sm text-ink">{order.quotation.estimatedDays} days</p>
              </div>
            )}
            {order.quotation.validUntil && (
              <div>
                <p className="text-xs text-muted-foreground">Valid until</p>
                <p className="mt-1 text-sm text-ink">{formatDate(order.quotation.validUntil)}</p>
              </div>
            )}
            {order.quotation.message && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Message from the forge</p>
                <p className="mt-2 text-sm leading-relaxed text-ink">{order.quotation.message}</p>
              </div>
            )}
          </div>
          <div className="mt-5 border-t border-copper/15 pt-5">
            <p className="text-xs text-muted-foreground">
              To approve this quotation, reply to your confirmation email or contact us at{" "}
              <a href="mailto:atelier@flint.studio" className="text-copper hover:underline">
                atelier@flint.studio
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* Commission details */}
      <div className="border border-border bg-white p-6">
        <h3 className="font-heading text-base text-ink">Commission Details</h3>
        <dl className="mt-5 grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Product type</dt>
            <dd className="mt-1 capitalize text-ink">{order.productType}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Design style</dt>
            <dd className="mt-1 capitalize text-ink">{order.designStyle.replace(/_/g, " ")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Vision</dt>
            <dd className="mt-1 leading-relaxed text-ink">{order.description}</dd>
          </div>
          {order.intendedUse && (
            <div>
              <dt className="text-xs text-muted-foreground">Intended use</dt>
              <dd className="mt-1 text-ink">{order.intendedUse}</dd>
            </div>
          )}
          {(order.budgetMin || order.budgetMax) && (
            <div>
              <dt className="text-xs text-muted-foreground">Budget</dt>
              <dd className="mt-1 text-ink">
                {order.budgetMin && formatCurrency(order.budgetMin)}
                {order.budgetMin && order.budgetMax && " – "}
                {order.budgetMax && formatCurrency(order.budgetMax)}
              </dd>
            </div>
          )}
          {order.preferredDeliveryDate && (
            <div>
              <dt className="text-xs text-muted-foreground">Preferred delivery</dt>
              <dd className="mt-1 text-ink">{formatDate(order.preferredDeliveryDate)}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Preferences */}
      {Object.keys(order.preferences).length > 0 && (
        <div className="border border-border bg-white p-6">
          <h3 className="font-heading text-base text-ink">Specifications</h3>
          <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            {Object.entries(order.preferences).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs capitalize text-muted-foreground">
                  {k.replace(/_/g, " ")}
                </dt>
                <dd className="mt-1 capitalize text-ink">{String(v).replace(/_/g, " ")}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Reference images */}
      {order.referenceImages.length > 0 && (
        <div className="border border-border bg-white p-6">
          <h3 className="font-heading text-base text-ink">Reference Images</h3>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {order.referenceImages.map((img, i) => (
              <a
                key={i}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square overflow-hidden border border-border block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt ?? `Reference ${i + 1}`}
                  className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
