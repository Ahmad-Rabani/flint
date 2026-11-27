export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Product } from "@/models/Product";
import { formatCurrency, cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function AdminInventoryPage({ searchParams }: Props) {
  await requireAdminSession("inventory.view");
  const { filter = "all" } = await searchParams;

  await connection();
  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseFilter: Record<string, any> = { deletedAt: null, status: { $ne: "archived" } };
  if (filter === "low") {
    baseFilter.$expr = { $lte: ["$stock", "$minStockLevel"] };
  } else if (filter === "out") {
    baseFilter.stock = 0;
  }

  const docs = await Product.find(baseFilter)
    .select("_id name sku stock minStockLevel price status images")
    .sort({ stock: 1, name: 1 })
    .lean();

  const [totalProducts, lowStockCount, outOfStockCount] = await Promise.all([
    Product.countDocuments({ deletedAt: null, status: { $ne: "archived" } }),
    Product.countDocuments({ deletedAt: null, status: { $ne: "archived" }, $expr: { $lte: ["$stock", "$minStockLevel"] } }),
    Product.countDocuments({ deletedAt: null, status: { $ne: "archived" }, stock: 0 }),
  ]);

  const items = docs.map((p) => ({
    id: String(p._id),
    name: p.name,
    sku: p.sku,
    stock: p.stock ?? 0,
    minStockLevel: p.minStockLevel ?? 5,
    price: p.price,
    status: p.status,
    imageUrl: (p.images as { url: string }[])?.[0]?.url ?? null,
    isLowStock: (p.stock ?? 0) <= (p.minStockLevel ?? 5) && (p.stock ?? 0) > 0,
    isOutOfStock: (p.stock ?? 0) === 0,
  }));

  const filters = [
    { value: "all", label: `All (${totalProducts})` },
    { value: "low", label: `Low Stock (${lowStockCount})` },
    { value: "out", label: `Out of Stock (${outOfStockCount})` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Inventory</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Stock Overview</h1>
        </div>
        <div className="flex gap-3">
          <span className="border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700">
            {lowStockCount} low stock
          </span>
          <span className="border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm text-orange-700">
            {outOfStockCount} out of stock
          </span>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={`/admin/inventory?filter=${f.value}`}
            className={cn(
              "border px-3 py-1.5 text-sm transition-colors",
              filter === f.value
                ? "border-[#171717] bg-[#171717] text-ivory"
                : "border-[#171717]/20 text-[#171717]/60 hover:border-copper hover:text-copper"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-5 border border-[#171717]/10 bg-white overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/30">No products found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Product</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">SKU</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40">Stock</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40">Min Level</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40">Price</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Status</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {items.map((p) => (
                <tr
                  key={p.id}
                  className={cn(
                    "transition-colors",
                    p.isOutOfStock ? "bg-red-50/50" : p.isLowStock ? "bg-yellow-50/50" : "hover:bg-[#171717]/[0.02]"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="h-9 w-9 object-cover border border-[#171717]/10 shrink-0" />
                      ) : (
                        <div className="h-9 w-9 border border-[#171717]/10 bg-[#171717]/5 shrink-0" />
                      )}
                      <p className="font-medium text-[#171717]">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#171717]/50">{p.sku}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "font-semibold text-sm",
                      p.isOutOfStock ? "text-red-600" : p.isLowStock ? "text-yellow-600" : "text-[#171717]"
                    )}>
                      {p.stock}
                    </span>
                    {p.isOutOfStock && <span className="ml-1.5 text-xs text-red-500">out</span>}
                    {p.isLowStock && !p.isOutOfStock && <span className="ml-1.5 text-xs text-yellow-600">low</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-[#171717]/50">{p.minStockLevel}</td>
                  <td className="px-4 py-3 text-right text-[#171717]">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize text-[#171717]/50">{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-xs text-copper/60 hover:text-copper transition-colors">
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
