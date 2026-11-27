import Link from "next/link";
import { connection } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Order } from "@/models";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderNumber } = await params;
  await connection();
  await connectToDatabase();

  const order = await Order.findOne({ orderNumber, deletedAt: null }).lean();
  if (!order) notFound();

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-6 py-20 lg:px-10">
        <p className="text-xs uppercase tracking-[0.25em] text-copper">Order confirmed</p>
        <h1 className="mt-3 font-heading text-4xl md:text-5xl text-ink">Thank you</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Your order <span className="text-ink">{order.orderNumber}</span> has been received and is
          awaiting payment confirmation via your selected method.
        </p>

        <div className="mt-10 border border-border bg-white p-6 md:p-8">
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Order number</dt>
              <dd className="mt-1 text-ink">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Placed</dt>
              <dd className="mt-1 text-ink">
                {order.placedAt ? formatDate(order.placedAt) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1 capitalize text-ink">{order.status.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="mt-1 capitalize text-ink">
                {(order.paymentMethod || "pending").replaceAll("_", " ")} · {order.paymentStatus}
              </dd>
            </div>
          </dl>

          <ul className="mt-8 space-y-3 border-t border-border pt-6">
            {(order.items ?? []).map(
              (
                item: { sku: string; name: string; quantity: number; lineTotal: number },
                index: number,
              ) => (
              <li key={`${item.sku}-${index}`} className="flex justify-between text-sm">
                <span className="text-ink">
                  {item.name} × {item.quantity}
                </span>
                <span>{formatCurrency(item.lineTotal, order.currency)}</span>
              </li>
              ),
            )}
          </ul>

          <div className="mt-6 flex justify-between border-t border-border pt-4 text-base">
            <span className="font-medium text-ink">Total</span>
            <span className="font-medium text-ink">
              {formatCurrency(order.total, order.currency)}
            </span>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/account/orders"
            className="inline-flex h-12 items-center bg-ink px-6 text-xs uppercase tracking-[0.2em] text-ivory"
          >
            View account orders
          </Link>
          <Link
            href="/catalogue"
            className="inline-flex h-12 items-center border border-ink px-6 text-xs uppercase tracking-[0.2em] text-ink"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
