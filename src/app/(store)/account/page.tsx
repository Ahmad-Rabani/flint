export const instant = false;

import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getCustomerOrders } from "@/features/orders/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function AccountHomePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const orders = await getCustomerOrders(session).catch(() => []);
  const recent = orders.slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="border border-border bg-white p-6">
        <h2 className="font-heading text-2xl text-ink">Overview</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your profile, track orders, and continue custom design requests.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="border border-border/80 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Orders</p>
            <p className="mt-2 font-heading text-3xl text-ink">{orders.length}</p>
          </div>
          <Link href="/custom" className="border border-border/80 p-4 transition-colors hover:border-copper">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Custom</p>
            <p className="mt-2 text-sm text-ink">Start a new design request →</p>
          </Link>
          <Link href="/account/wishlist" className="border border-border/80 p-4 transition-colors hover:border-copper">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Wishlist</p>
            <p className="mt-2 text-sm text-ink">View saved pieces →</p>
          </Link>
        </div>
      </section>

      <section className="border border-border bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-2xl text-ink">Recent orders</h2>
          <Link href="/account/orders" className="text-xs uppercase tracking-widest text-copper">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="mt-6 divide-y divide-border">
            {recent.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <Link href={`/account/orders/${order.orderNumber}`} className="text-ink hover:text-copper">
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {order.placedAt ? formatDate(order.placedAt) : "—"} · {order.itemCount} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-ink">{formatCurrency(order.total, order.currency)}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {order.status.replaceAll("_", " ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
