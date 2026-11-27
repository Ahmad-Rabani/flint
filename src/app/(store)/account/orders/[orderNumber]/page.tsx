import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCustomerOrderByNumber } from "@/features/orders/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function AccountOrderDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/orders");

  const { orderNumber } = await params;
  const order = await getCustomerOrderByNumber(session, orderNumber);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="border border-border bg-white p-6">
        <Link href="/account/orders" className="text-xs uppercase tracking-widest text-copper">
          ← All orders
        </Link>
        <h2 className="mt-4 font-heading text-3xl text-ink">{order.orderNumber}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Placed {order.placedAt ? formatDate(order.placedAt) : "—"} ·{" "}
          <span className="capitalize">{order.status.replaceAll("_", " ")}</span>
        </p>

        <ul className="mt-8 space-y-4 border-t border-border pt-6">
          {order.items.map((item, index) => (
            <li key={`${item.sku}-${index}`} className="flex justify-between gap-4 text-sm">
              <div>
                <p className="text-ink">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.sku} · Qty {item.quantity}
                </p>
              </div>
              <p>{formatCurrency(item.lineTotal, order.currency)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatCurrency(order.subtotal, order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Discount</dt>
            <dd>-{formatCurrency(order.discountAmount, order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd>{formatCurrency(order.taxAmount, order.currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{formatCurrency(order.shippingAmount, order.currency)}</dd>
          </div>
          <div className="flex justify-between pt-2 text-base">
            <dt className="font-medium text-ink">Total</dt>
            <dd className="font-medium text-ink">
              {formatCurrency(order.total, order.currency)}
            </dd>
          </div>
        </dl>
      </div>

      {order.shippingAddress && (
        <div className="border border-border bg-white p-6">
          <h3 className="font-heading text-xl text-ink">Shipping address</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? (
              <>
                <br />
                {order.shippingAddress.line2}
              </>
            ) : null}
            <br />
            {order.shippingAddress.city}
            {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}{" "}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
            <br />
            {order.shippingAddress.phone}
          </p>
        </div>
      )}
    </div>
  );
}
