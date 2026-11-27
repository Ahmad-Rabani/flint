export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/permissions";
import { formatCurrency, cn } from "@/lib/utils";
import { getStockAlertCounts, listInventoryOverview } from "@/features/inventory/queries";
import { parseStockFilter } from "@/features/inventory/types";
import { InventorySubnav } from "./_components/inventory-subnav";
import { InventoryPagination, withQuery } from "./_components/pagination";
import { StockBadge } from "./_components/stock-badge";
import { formatUnits } from "./_components/format";

type Props = { searchParams: Promise<{ q?: string; filter?: string; page?: string }> };

export default async function AdminInventoryPage({ searchParams }: Props) {
  const session = await requireAdminSession("inventory.view");
  const canAdjust = hasPermission(session, "inventory.manage");
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const filter = parseStockFilter(sp.filter);
  const page = Number(sp.page ?? "1");

  await connection();
  const [list, alerts] = await Promise.all([
    listInventoryOverview({ q, filter, page, pageSize: 30 }),
    getStockAlertCounts(q),
  ]);

  const chips = [
    { value: "all", label: `All (${alerts.all})` },
    { value: "low", label: `Low stock (${alerts.low})` },
    { value: "out", label: `Out of stock (${alerts.out})` },
    { value: "in", label: `In stock (${alerts.in})` },
  ];
  const scoped = Boolean(q) || filter !== "all";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Inventory</p>
          <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Stock Overview</h1>
          <p className="mt-1 text-sm text-[#1B365D]/50">
            On-hand units, cost, and selling price for the live catalogue.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={withQuery("/admin/inventory", { q, filter: "low" })}
            className="border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-800"
          >
            {alerts.low} low stock
          </Link>
          <Link
            href={withQuery("/admin/inventory", { q, filter: "out" })}
            className="border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700"
          >
            {alerts.out} out of stock
          </Link>
        </div>
      </div>

      <InventorySubnav current="/admin/inventory" canAdjust={canAdjust} />

      <form method="GET" className="mt-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU, or barcode"
          className="w-64 border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none"
        />
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        <button
          type="submit"
          className="border border-[#1B365D]/20 px-4 py-2 text-sm text-[#1B365D]/60 transition-colors hover:border-copper hover:text-copper"
        >
          Search
        </button>
        {(q || filter !== "all") && (
          <Link href="/admin/inventory" className="px-4 py-2 text-sm text-[#1B365D]/40 hover:text-[#1B365D]">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={chip.value}
            href={withQuery("/admin/inventory", { q, filter: chip.value === "all" ? undefined : chip.value })}
            className={cn(
              "border px-3 py-1.5 text-sm transition-colors",
              filter === chip.value
                ? "border-[#1B365D] bg-[#1B365D] text-ivory"
                : "border-[#1B365D]/20 text-[#1B365D]/60 hover:border-copper hover:text-copper",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="border border-[#1B365D]/10 bg-white px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1B365D]/40">
            {scoped ? "Matching SKUs" : "SKUs"}
          </p>
          <p className="mt-1 font-heading text-3xl text-[#1B365D]">{formatUnits(list.stats.skuCount)}</p>
        </div>
        <div className="border border-[#1B365D]/10 bg-white px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1B365D]/40">Units on hand</p>
          <p className="mt-1 font-heading text-3xl text-[#1B365D]">{formatUnits(list.stats.unitsOnHand)}</p>
        </div>
        <div className="border border-[#1B365D]/10 bg-white px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1B365D]/40">Inventory valuation</p>
          <p className="mt-1 font-heading text-3xl text-[#1B365D]">{formatCurrency(list.stats.valuation)}</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto border border-[#1B365D]/10 bg-white">
        {list.items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-[#1B365D]/45">
              {q || filter !== "all" ? "No products match this search." : "No products in the catalogue yet."}
            </p>
            {!q && filter === "all" && (
              <Link href="/admin/products" className="mt-3 inline-block text-sm text-copper">
                View products
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1B365D]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Product</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">SKU</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Barcode</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Stock</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Min</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Cost</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Price</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Valuation</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Status</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B365D]/5">
              {list.items.map((product) => (
                <tr
                  key={product.id}
                  className={cn(
                    "transition-colors",
                    product.stockStatus === "out"
                      ? "bg-red-50/60"
                      : product.stockStatus === "low"
                        ? "bg-amber-50/50"
                        : "hover:bg-[#1B365D]/[0.02]",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-9 w-9 shrink-0 border border-[#1B365D]/10 object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 shrink-0 border border-[#1B365D]/10 bg-[#1B365D]/5" />
                      )}
                      <div>
                        <p className="font-medium text-[#1B365D]">{product.name}</p>
                        {product.tracksVariants && (
                          <p className="text-xs text-[#1B365D]/40">{product.variantCount} variants</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#1B365D]/55">{product.sku}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#1B365D]/45">{product.barcode ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#1B365D]">
                    {formatUnits(product.stock)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#1B365D]/50">{product.minStockLevel}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#1B365D]/70">
                    {formatCurrency(product.costPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#1B365D]">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#1B365D]">
                    {formatCurrency(product.valuation)}
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge status={product.stockStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3 whitespace-nowrap">
                      {canAdjust && (
                        <Link
                          href={`/admin/inventory/adjustments?productId=${product.id}`}
                          className="text-xs text-copper/80 transition-colors hover:text-copper"
                        >
                          Adjust
                        </Link>
                      )}
                      <Link
                        href={`/admin/inventory/movements?productId=${product.id}`}
                        className="text-xs text-[#1B365D]/45 transition-colors hover:text-[#1B365D]"
                      >
                        Movements
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InventoryPagination
        page={list.page}
        totalPages={list.totalPages}
        makeHref={(nextPage) =>
          withQuery("/admin/inventory", { q, filter: filter === "all" ? undefined : filter }, nextPage)
        }
      />
    </div>
  );
}
