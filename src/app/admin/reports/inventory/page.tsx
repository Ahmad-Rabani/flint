export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { parseReportRange } from "@/features/reports/range";
import { getInventoryReport, getReportCurrency } from "@/features/reports/queries";
import type { StockRow } from "@/features/reports/queries";
import { EmptyNote, MetricCard, ReportShell } from "../_components/report-shell";

type Props = { searchParams: Promise<{ from?: string; to?: string }> };

export default async function InventoryReportPage({ searchParams }: Props) {
  const session = await requireAdminSession("reports.view");
  const canFinancial = hasPermission(session, "reports.financial");
  const sp = await searchParams;
  const range = parseReportRange(sp.from, sp.to);
  await connection();
  const [report, currency] = await Promise.all([getInventoryReport(), getReportCurrency()]);
  const money = (amount: number) => formatCurrency(amount, currency);

  return (
    <ReportShell
      title="Inventory"
      current="/admin/reports/inventory"
      range={range}
      showRange={false}
      description="Current catalogue snapshot. Archived products are excluded. Stock on variant products is the sum of variant units."
    >
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="SKUs" value={String(report.skuCount)} />
        <MetricCard label="Retail value" value={money(report.retailValue)} hint="Stock × selling price" />
        {canFinancial ? (
          <MetricCard label="Stock value" value={money(report.stockValue)} hint="Stock × cost" />
        ) : null}
        <MetricCard label="Low stock" value={String(report.lowStockCount)} hint={`${report.outOfStockCount} out of stock`} />
      </div>

      {!canFinancial ? (
        <p className="mt-4 text-sm text-[#1B365D]/50">
          Cost and stock valuation are hidden. They require the reports.financial permission.
        </p>
      ) : null}

      {report.skuCount === 0 ? (
        <EmptyNote>No catalogue products yet.</EmptyNote>
      ) : (
        <div className="mt-8 space-y-8">
          <StockTable
            title="Low stock"
            empty="No products are below their minimum and still in stock."
            rows={report.lowStock}
            money={money}
            canFinancial={canFinancial}
          />
          <StockTable
            title="Out of stock"
            empty="No products are out of stock."
            rows={report.outOfStock}
            money={money}
            canFinancial={canFinancial}
          />
          <p className="text-sm text-[#1B365D]/50">
            <Link href="/admin/inventory/low-stock" className="text-[#1B365D] underline decoration-[#1B365D]/25 underline-offset-4 hover:text-copper">
              Open the inventory low-stock list
            </Link>
          </p>
        </div>
      )}
    </ReportShell>
  );
}

function StockTable({
  title,
  empty,
  rows,
  money,
  canFinancial,
}: {
  title: string;
  empty: string;
  rows: StockRow[];
  money: (amount: number) => string;
  canFinancial: boolean;
}) {
  return (
    <section>
      <h2 className="font-heading text-2xl text-[#1B365D]">{title}</h2>
      {rows.length === 0 ? (
        <EmptyNote>{empty}</EmptyNote>
      ) : (
        <div className="mt-4 overflow-x-auto border border-[#1B365D]/10 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1B365D]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Product</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">SKU</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Stock</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Min</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Retail</th>
                {canFinancial ? (
                  <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Cost value</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B365D]/5">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-[#1B365D]">
                    <Link href={`/admin/products/${row.id}`} className="hover:text-copper">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#1B365D]/60">{row.sku}</td>
                  <td className="px-4 py-3 text-right text-[#1B365D]">{row.stock}</td>
                  <td className="px-4 py-3 text-right text-[#1B365D]/60">{row.minStockLevel}</td>
                  <td className="px-4 py-3 text-right text-[#1B365D]">{money(row.retailValue)}</td>
                  {canFinancial ? <td className="px-4 py-3 text-right text-[#1B365D]">{money(row.stockValue)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
