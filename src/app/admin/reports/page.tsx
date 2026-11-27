export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { formatCurrency } from "@/lib/utils";
import { formatReportDay, parseReportRange, reportHref } from "@/features/reports/range";
import { getReportCurrency, getSalesOverview } from "@/features/reports/queries";
import { EmptyNote, MetricCard, ReportShell } from "./_components/report-shell";

type Props = { searchParams: Promise<{ from?: string; to?: string }> };

export default async function AdminReportsPage({ searchParams }: Props) {
  await requireAdminSession("reports.view");
  const sp = await searchParams;
  const range = parseReportRange(sp.from, sp.to);
  await connection();
  const [report, currency] = await Promise.all([getSalesOverview(range), getReportCurrency()]);
  const money = (amount: number) => formatCurrency(amount, currency);
  const hasSales = report.combined.count > 0;

  return (
    <ReportShell
      title="Overview"
      current="/admin/reports"
      range={range}
      description="Paid online and custom orders, plus completed POS sales. Register orders are counted once, from the POS record."
    >
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Online revenue" value={money(report.online.revenue)} hint={`${report.online.count} orders · AOV ${money(report.online.aov)}`} />
        <MetricCard label="POS revenue" value={money(report.pos.revenue)} hint={`${report.pos.count} sales · AOV ${money(report.pos.aov)}`} />
        <MetricCard label="Combined revenue" value={money(report.combined.revenue)} hint={`${report.combined.count} transactions · AOV ${money(report.combined.aov)}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href={reportHref("/admin/reports/orders", range)} className="text-[#171717] underline decoration-[#171717]/25 underline-offset-4 hover:text-copper">
          Order report
        </Link>
        <Link href={reportHref("/admin/reports/inventory", range)} className="text-[#171717] underline decoration-[#171717]/25 underline-offset-4 hover:text-copper">
          Inventory report
        </Link>
        <Link href={reportHref("/admin/reports/pos", range)} className="text-[#171717] underline decoration-[#171717]/25 underline-offset-4 hover:text-copper">
          POS report
        </Link>
      </div>

      <h2 className="mt-8 font-heading text-2xl text-[#171717]">Daily sales</h2>
      {!hasSales ? (
        <EmptyNote>No paid orders or completed POS sales in this date range.</EmptyNote>
      ) : (
        <div className="mt-4 overflow-x-auto border border-[#171717]/10 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Date</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">Online</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">POS</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {report.series.map((row) => (
                <tr key={row.date}>
                  <td className="px-4 py-3 text-[#171717]">{formatReportDay(row.date)}</td>
                  <td className="px-4 py-3 text-right text-[#171717]/80">{money(row.onlineRevenue)}</td>
                  <td className="px-4 py-3 text-right text-[#171717]/80">{money(row.posRevenue)}</td>
                  <td className="px-4 py-3 text-right text-[#171717]">{money(row.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.seriesTruncated ? (
            <p className="border-t border-[#171717]/10 px-4 py-3 text-xs text-[#171717]/45">
              This range is longer than 92 days, so only days with sales are listed.
            </p>
          ) : null}
        </div>
      )}

      <h2 className="mt-8 font-heading text-2xl text-[#171717]">Top products</h2>
      {report.topProducts.length === 0 ? (
        <EmptyNote>No products sold in this date range.</EmptyNote>
      ) : (
        <div className="mt-4 overflow-x-auto border border-[#171717]/10 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">Product</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">SKU</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">Qty</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {report.topProducts.map((row) => (
                <tr key={`${row.sku}-${row.name}`}>
                  <td className="px-4 py-3 text-[#171717]">{row.name}</td>
                  <td className="px-4 py-3 text-[#171717]/60">{row.sku}</td>
                  <td className="px-4 py-3 text-right text-[#171717]/80">{row.quantity}</td>
                  <td className="px-4 py-3 text-right text-[#171717]">{money(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportShell>
  );
}
