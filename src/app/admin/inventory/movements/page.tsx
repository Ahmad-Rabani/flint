export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { INVENTORY_MOVEMENT_TYPES } from "@/constants";
import { requireAdminSession } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { getInventoryProduct, listInventoryMovements } from "@/features/inventory/queries";
import { movementTypeLabel } from "@/features/inventory/types";
import { InventorySubnav } from "../_components/inventory-subnav";
import { InventoryPagination, withQuery } from "../_components/pagination";
import { formatDateTime } from "../_components/format";

type Props = {
  searchParams: Promise<{ type?: string; q?: string; from?: string; to?: string; productId?: string; page?: string }>;
};

export default async function InventoryMovementsPage({ searchParams }: Props) {
  const session = await requireAdminSession("inventory.view");
  const canAdjust = hasPermission(session, "inventory.manage");
  const sp = await searchParams;
  const type = sp.type ?? "";
  const q = sp.q?.trim() ?? "";
  const from = sp.from ?? "";
  const to = sp.to ?? "";
  const productId = sp.productId ?? "";
  const page = Number(sp.page ?? "1");

  await connection();
  const [list, product] = await Promise.all([
    listInventoryMovements({
      type: type || undefined,
      q,
      from,
      to,
      productId: productId || undefined,
      page,
      pageSize: 30,
    }),
    productId ? getInventoryProduct(productId) : Promise.resolve(null),
  ]);

  const filters = { type, q, from, to, productId };
  const hasFilters = Boolean(type || q || from || to || productId);

  return (
    <div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Inventory</p>
        <h1 className="mt-1 font-heading text-4xl text-[#171717]">Stock Movements</h1>
        <p className="mt-1 text-sm text-[#171717]/50">
          {list.total} movement{list.total === 1 ? "" : "s"}
          {hasFilters ? " match these filters" : " on record"}
        </p>
      </div>

      <InventorySubnav current="/admin/inventory/movements" canAdjust={canAdjust} />

      <form method="GET" className="mt-5 flex flex-wrap items-end gap-3">
        {productId && <input type="hidden" name="productId" value={productId} />}
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-[#171717]/40">SKU or name</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search"
            className="w-48 border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-[#171717]/40">Type</span>
          <select
            name="type"
            defaultValue={type}
            className="border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] focus:border-copper focus:outline-none"
          >
            <option value="">All types</option>
            {INVENTORY_MOVEMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {movementTypeLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-[#171717]/40">From</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] focus:border-copper focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-[#171717]/40">To</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] focus:border-copper focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="border border-[#171717]/20 px-4 py-2 text-sm text-[#171717]/60 transition-colors hover:border-copper hover:text-copper"
        >
          Filter
        </button>
        {hasFilters && (
          <Link href="/admin/inventory/movements" className="px-2 py-2 text-sm text-[#171717]/40 hover:text-[#171717]">
            Clear
          </Link>
        )}
      </form>

      {productId && (
        <p className="mt-3 text-sm text-[#171717]/60">
          {product ? (
            <>
              Showing movements for <span className="text-[#171717]">{product.name}</span>
            </>
          ) : (
            "Showing movements for a product that is no longer active."
          )}
          {" · "}
          <Link
            href={withQuery("/admin/inventory/movements", { type, q, from, to })}
            className="text-copper hover:text-copper/80"
          >
            Clear product
          </Link>
        </p>
      )}

      <div className="mt-5 overflow-x-auto border border-[#171717]/10 bg-white">
        {list.items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/40">
            {hasFilters ? "No stock movements match these filters." : "No stock movements yet."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Date</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">SKU</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Product</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Type</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">Qty</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">Before</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">After</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Reason</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Reference</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {list.items.map((row) => (
                <tr key={row.id} className="hover:bg-[#171717]/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#171717]/55">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#171717]/55">{row.sku}</td>
                  <td className="px-4 py-3 text-[#171717]">
                    {row.productId ? (
                      <Link href={`/admin/products/${row.productId}`} className="hover:text-copper">
                        {row.productName}
                      </Link>
                    ) : (
                      row.productName
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#171717]/70">{movementTypeLabel(row.type)}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold tabular-nums",
                      row.quantityChange > 0 ? "text-emerald-700" : "text-red-600",
                    )}
                  >
                    {row.quantityChange > 0 ? `+${row.quantityChange}` : row.quantityChange}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#171717]/50">{row.quantityBefore}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#171717]">{row.quantityAfter}</td>
                  <td className="max-w-[16rem] px-4 py-3 text-[#171717]/70">
                    <p>{row.reason ?? "—"}</p>
                    {row.notes && <p className="mt-0.5 text-xs text-[#171717]/40">{row.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#171717]/55">
                    {row.referenceType === "order" && row.referenceId ? (
                      <Link href={`/admin/orders/${row.referenceId}`} className="text-copper hover:text-copper/80">
                        Order
                      </Link>
                    ) : row.referenceType ? (
                      <span className="capitalize">{row.referenceType.replace(/_/g, " ")}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#171717]/55">{row.performedBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InventoryPagination
        page={list.page}
        totalPages={list.totalPages}
        makeHref={(nextPage) => withQuery("/admin/inventory/movements", filters, nextPage)}
      />
    </div>
  );
}
