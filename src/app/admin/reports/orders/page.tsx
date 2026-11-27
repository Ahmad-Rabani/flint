export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { formatCurrency } from "@/lib/utils";
import { parseReportRange } from "@/features/reports/range";
import { getOrderReport, getReportCurrency } from "@/features/reports/queries";
import { EmptyNote, MetricCard, ReportShell } from "../_components/report-shell";

type Props = { searchParams: Promise<{ from?: string; to?: string }> };

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

export default async function OrderReportPage({ searchParams }: Props) {
  await requireAdminSession("reports.view");
  const sp = await searchParams;
  const range = parseReportRange(sp.from, sp.to);
  await connection();
  const [report, currency] = await Promise.all([getOrderReport(range), getReportCurrency()]);
  const money = (amount: number) => formatCurrency(amount, currency);

  return (
    <ReportShell
      title="Orders"
      current="/admin/reports/orders"
      range={range}
      description="Every order placed in the range, including unpaid and cancelled. Amounts are order totals."
    >
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Orders" value={String(report.totalOrders)} />
        <MetricCard label="Order total" value={money(report.totalAmount)} />
      </div>

      {report.totalOrders === 0 ? (
        <EmptyNote>No orders in this date range.</EmptyNote>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Breakdown title="By status" rows={report.byStatus} money={money} />
          <Breakdown title="By source" rows={report.bySource} money={money} />
        </div>
      )}
    </ReportShell>
  );
}

function Breakdown({
  title,
  rows,
  money,
}: {
  title: string;
  rows: { key: string; count: number; total: number }[];
  money: (amount: number) => string;
}) {
  return (
    <section>
      <h2 className="font-heading text-2xl text-[#171717]">{title}</h2>
      <div className="mt-4 overflow-x-auto border border-[#171717]/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#171717]/10">
              <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#171717]/40">{title === "By status" ? "Status" : "Source"}</th>
              <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">Orders</th>
              <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#171717]/40">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171717]/5">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-3 capitalize text-[#171717]">{labelize(row.key)}</td>
                <td className="px-4 py-3 text-right text-[#171717]/80">{row.count}</td>
                <td className="px-4 py-3 text-right text-[#171717]">{money(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
