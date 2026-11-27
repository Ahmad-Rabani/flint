export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { getInventoryProduct, listRecentAdjustments } from "@/features/inventory/queries";
import { movementTypeLabel } from "@/features/inventory/types";
import { cn } from "@/lib/utils";
import { InventorySubnav } from "../_components/inventory-subnav";
import { formatDateTime } from "../_components/format";
import { AdjustmentForm } from "./adjustment-form";

type Props = { searchParams: Promise<{ productId?: string; variantId?: string }> };

export default async function InventoryAdjustmentsPage({ searchParams }: Props) {
  await requireAdminSession("inventory.manage");
  const sp = await searchParams;
  await connection();

  const [product, recent] = await Promise.all([
    sp.productId ? getInventoryProduct(sp.productId) : Promise.resolve(null),
    listRecentAdjustments(12),
  ]);

  return (
    <div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Inventory</p>
        <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Stock Adjustments</h1>
        <p className="mt-1 text-sm text-[#1B365D]/50">
          Receive, write off, transfer, or correct stock. Each save updates the product and writes a movement.
        </p>
      </div>

      <InventorySubnav current="/admin/inventory/adjustments" canAdjust />

      <div className="mt-6">
        <AdjustmentForm
          key={`${product?.id ?? "none"}:${sp.variantId ?? ""}`}
          initialProduct={product}
          initialVariantId={sp.variantId}
        />
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-2xl text-[#1B365D]">Recent adjustments</h2>
        <p className="mt-1 text-sm text-[#1B365D]/45">
          Purchases, damage, transfers, returns, and manual corrections. Online sales stay on Movements.
        </p>
        <div className="mt-4 overflow-x-auto border border-[#1B365D]/10 bg-white">
          {recent.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#1B365D]/40">
              No manual adjustments yet. The first correction will show up here.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1B365D]/10">
                  <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Date</th>
                  <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Product</th>
                  <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Type</th>
                  <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Change</th>
                  <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Before</th>
                  <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">After</th>
                  <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Reason</th>
                  <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B365D]/5">
                {recent.map((row) => (
                  <tr key={row.id} className="hover:bg-[#1B365D]/[0.02]">
                    <td className="px-4 py-3 text-xs text-[#1B365D]/55 whitespace-nowrap">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#1B365D]">{row.productName}</p>
                      <p className="font-mono text-xs text-[#1B365D]/40">{row.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-[#1B365D]/70">{movementTypeLabel(row.type)}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold tabular-nums",
                        row.quantityChange > 0 ? "text-emerald-700" : "text-red-600",
                      )}
                    >
                      {row.quantityChange > 0 ? `+${row.quantityChange}` : row.quantityChange}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1B365D]/50">{row.quantityBefore}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#1B365D]">{row.quantityAfter}</td>
                    <td className="px-4 py-3 text-[#1B365D]/70">
                      <p>{row.reason ?? "—"}</p>
                      {row.notes && <p className="mt-0.5 text-xs text-[#1B365D]/40">{row.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-[#1B365D]/55">{row.performedBy ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="mt-3 text-sm">
          <Link href="/admin/inventory/movements" className="text-copper/80 hover:text-copper">
            View all movements
          </Link>
        </p>
      </div>
    </div>
  );
}
