export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCustomerOrders } from "@/features/orders/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AccountOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/orders");

  const orders = await getCustomerOrders(session).catch(() => []);

  return (
    <div className="border border-border bg-white p-6">
      <h2 className="font-heading text-2xl text-ink">Order history</h2>
      {orders.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">You have not placed any orders yet.</p>
          <Link
            href="/catalogue"
            className="mt-6 inline-flex h-11 items-center bg-ink px-5 text-xs uppercase tracking-[0.2em] text-ivory"
          >
            Shop catalogue
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div>
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="text-ink transition-colors hover:text-copper"
                >
                  {order.orderNumber}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {order.placedAt ? formatDate(order.placedAt) : "—"} · {order.itemCount} items ·{" "}
                  <span className="capitalize">{order.status.replaceAll("_", " ")}</span>
                </p>
              </div>
              <p className="text-sm text-ink">{formatCurrency(order.total, order.currency)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
