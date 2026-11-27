export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { Customer } from "@/models/Customer";
import { CustomOrder } from "@/models/CustomOrder";
import { formatCurrency, formatDate } from "@/lib/utils";

async function getDashboardData() {
  await connection();
  await connectToDatabase();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    lowStockProducts,
    totalCustomers,
    pendingCustomOrders,
    revenueData,
    recentOrders,
    recentCustomOrders,
    orderCount,
  ] = await Promise.all([
    Product.countDocuments({ deletedAt: null, status: { $ne: "archived" } }),
    Product.countDocuments({
      deletedAt: null,
      status: "active",
      $expr: { $lte: ["$stock", "$minStockLevel"] },
    }),
    Customer.countDocuments({ deletedAt: null }),
    CustomOrder.countDocuments({
      deletedAt: null,
      status: { $in: ["submitted", "under_review", "more_info_required"] },
    }),
    Order.aggregate([
      {
        $match: {
          deletedAt: null,
          source: "online",
          status: { $in: ["paid", "processing", "shipped", "delivered", "completed"] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]),
    Order.find({ deletedAt: null, source: "online" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    CustomOrder.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Order.countDocuments({ deletedAt: null, source: "online" }),
  ]);

  const revenue = revenueData[0]?.total ?? 0;
  const recentOrderCount = revenueData[0]?.count ?? 0;

  return {
    totalProducts,
    lowStockProducts,
    totalCustomers,
    pendingCustomOrders,
    revenue,
    recentOrderCount,
    orderCount,
    recentOrders: recentOrders.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      currency: o.currency ?? "USD",
      createdAt: o.createdAt ? new Date(String(o.createdAt)).toISOString() : "",
    })),
    recentCustomOrders: recentCustomOrders.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      status: o.status,
      productType: o.productType,
      createdAt: o.createdAt ? new Date(String(o.createdAt)).toISOString() : "",
    })),
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600",
  awaiting_payment: "text-orange-600",
  paid: "text-green-600",
  processing: "text-blue-600",
  shipped: "text-sky-600",
  delivered: "text-emerald-600",
  completed: "text-green-700",
  cancelled: "text-red-600",
  submitted: "text-blue-600",
  under_review: "text-yellow-600",
  more_info_required: "text-orange-600",
  quotation_sent: "text-copper",
  in_progress: "text-blue-600",
};

export default async function AdminDashboardPage() {
  await requireAdminSession("dashboard.view");
  const data = await getDashboardData();

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Admin</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">Dashboard</h1>
      <p className="mt-2 text-sm text-[#171717]/50">Last 30 days revenue overview</p>

      {/* Metric cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue (30d)"
          value={formatCurrency(data.revenue)}
          sub={`${data.recentOrderCount} paid orders`}
          href="/admin/orders"
        />
        <MetricCard
          label="Total Orders"
          value={String(data.orderCount)}
          sub="Online orders"
          href="/admin/orders"
        />
        <MetricCard
          label="Customers"
          value={String(data.totalCustomers)}
          sub="Registered"
          href="/admin/customers"
        />
        <MetricCard
          label="Products"
          value={String(data.totalProducts)}
          sub={`${data.lowStockProducts} low stock`}
          href="/admin/products"
          alert={data.lowStockProducts > 0}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Pending Custom Orders"
          value={String(data.pendingCustomOrders)}
          sub="Awaiting review"
          href="/admin/custom-orders"
          alert={data.pendingCustomOrders > 0}
        />
        <MetricCard
          label="Low Stock Items"
          value={String(data.lowStockProducts)}
          sub="Need restocking"
          href="/admin/inventory"
          alert={data.lowStockProducts > 0}
        />
      </div>

      {/* Recent tables */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Recent Online Orders */}
        <div className="border border-[#171717]/10 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-lg text-[#171717]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-copper/70 hover:text-copper transition-colors">
              View all →
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-[#171717]/40">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#171717]/10">
                  <th className="pb-2.5 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Order</th>
                  <th className="pb-2.5 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Status</th>
                  <th className="pb-2.5 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171717]/5">
                {data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-[#171717] hover:text-copper transition-colors font-medium">
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-[#171717]/40">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs capitalize ${STATUS_COLORS[order.status] ?? "text-[#171717]/50"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 text-right text-[#171717]">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Recent Custom Orders */}
        <div className="border border-[#171717]/10 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-lg text-[#171717]">Recent Commissions</h2>
            <Link href="/admin/custom-orders" className="text-xs text-copper/70 hover:text-copper transition-colors">
              View all →
            </Link>
          </div>
          {data.recentCustomOrders.length === 0 ? (
            <p className="text-sm text-[#171717]/40">No custom orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#171717]/10">
                  <th className="pb-2.5 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Order</th>
                  <th className="pb-2.5 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Customer</th>
                  <th className="pb-2.5 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171717]/5">
                {data.recentCustomOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3">
                      <Link href={`/admin/custom-orders/${order.id}`} className="text-[#171717] hover:text-copper transition-colors font-medium">
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs capitalize text-[#171717]/40">{order.productType}</p>
                    </td>
                    <td className="py-3 text-[#171717]/70">{order.customerName}</td>
                    <td className="py-3">
                      <span className={`text-xs capitalize ${STATUS_COLORS[order.status] ?? "text-[#171717]/50"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  href,
  alert,
}: {
  label: string;
  value: string;
  sub: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block border border-[#171717]/10 bg-white p-5 transition-colors hover:border-copper/30 hover:bg-copper/5"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#171717]/40">{label}</p>
      <p className={`mt-2 font-heading text-3xl ${alert ? "text-copper" : "text-[#171717]"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-[#171717]/40">{sub}</p>
    </Link>
  );
}
