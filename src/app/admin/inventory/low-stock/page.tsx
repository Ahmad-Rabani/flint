export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { listLowStockProducts } from "@/features/inventory/queries";
import { InventorySubnav } from "../_components/inventory-subnav";
import { InventoryPagination, withQuery } from "../_components/pagination";
import { StockBadge } from "../_components/stock-badge";
import { formatUnits } from "../_components/format";

type Props = { searchParams: Promise<{ page?: string }> };

export default async function LowStockPage({ searchParams }: Props) {
  const session = await requireAdminSession("inventory.view");
  const canAdjust = hasPermission(session, "inventory.manage");
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");

  await connection();
  const list = await listLowStockProducts({ page, pageSize: 40 });
  const lowCount = Math.max(0, list.stats.skuCount - list.stats.critical);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Inventory</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Low Stock Alerts</h1>
          <p className="mt-1 text-sm text-[#171717]/50">
            Products at or below their minimum level. Out-of-stock rows are marked critical.
          </p>
        </div>
        <div className="flex gap-3">
          <span className="border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700">
            {list.stats.critical} critical
          </span>
          <span className="border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
            {lowCount} low
          </span>
        </div>
      </div>

      <InventorySubnav current="/admin/inventory/low-stock" canAdjust={canAdjust} />

      <div className="mt-5 overflow-x-auto border border-[#171717]/10 bg-white">
        {list.items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[#171717]/45">Nothing is at or below its minimum.</p>
            <p className="mt-2 text-xs text-[#171717]/35">Stock levels look healthy.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Product</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">SKU</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">On hand</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">Minimum</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Status</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {list.items.map((product) => {
                const critical = product.stock <= 0;
                return (
                  <tr key={product.id} className={cn(critical ? "bg-red-50/70" : "bg-amber-50/50")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-9 w-9 shrink-0 border border-[#171717]/10 object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 shrink-0 border border-[#171717]/10 bg-[#171717]/5" />
                        )}
                        <div>
                          <p className="font-medium text-[#171717]">{product.name}</p>
                          {product.tracksVariants && (
                            <p className="text-xs text-[#171717]/40">{product.variantCount} variants</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#171717]/55">{product.sku}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold tabular-nums",
                        critical ? "text-red-700" : "text-amber-800",
                      )}
                    >
                      {formatUnits(product.stock)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#171717]/50">{product.minStockLevel}</td>
                    <td className="px-4 py-3">
                      <StockBadge status={product.stockStatus} label={critical ? "Critical" : "Low"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        {canAdjust ? (
                          <Link
                            href={`/admin/inventory/adjustments?productId=${product.id}`}
                            className="text-xs text-copper/80 transition-colors hover:text-copper"
                          >
                            Adjust stock
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-xs text-[#171717]/45 hover:text-[#171717]"
                          >
                            View product
                          </Link>
                        )}
                        <Link
                          href={`/admin/inventory/movements?productId=${product.id}`}
                          className="text-xs text-[#171717]/45 hover:text-[#171717]"
                        >
                          Movements
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <InventoryPagination
        page={list.page}
        totalPages={list.totalPages}
        makeHref={(nextPage) => withQuery("/admin/inventory/low-stock", {}, nextPage)}
      />
    </div>
  );
}
