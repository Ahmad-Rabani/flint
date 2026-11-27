export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { formatCurrency } from "@/lib/utils";
import { parseReportRange } from "@/features/reports/range";
import { getPosReport, getReportCurrency } from "@/features/reports/queries";
import { EmptyNote, MetricCard, ReportShell } from "../_components/report-shell";

type Props = { searchParams: Promise<{ from?: string; to?: string }> };

export default async function PosReportPage({ searchParams }: Props) {
  await requireAdminSession("reports.view");
  const sp = await searchParams;
  const range = parseReportRange(sp.from, sp.to);
  await connection();
  const [report, currency] = await Promise.all([getPosReport(range), getReportCurrency()]);
  const money = (amount: number) => formatCurrency(amount, currency);
  const hasActivity = report.completed.count > 0 || report.refunded.count > 0;
  const methods = report.completed.count > 0 ? report.byPaymentMethod : report.byPaymentMethod.filter((row) => row.count > 0);

  return (
    <ReportShell
      title="POS"
      current="/admin/reports/pos"
      range={range}
      description="Completed register sales and refunds. Voided tickets are left out of both totals."
    >
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Completed sales" value={money(report.completed.total)} hint={`${report.completed.count} tickets`} />
        <MetricCard label="Average sale" value={report.completed.count > 0 ? money(report.completed.total / report.completed.count) : money(0)} />
        <MetricCard label="Refunded" value={money(report.refunded.total)} hint={`${report.refunded.count} tickets`} />
        <MetricCard label="Net of refunds" value={money(report.completed.total - report.refunded.total)} />
      </div>

      {!hasActivity ? (
        <EmptyNote>No POS sales in this date range.</EmptyNote>
      ) : (
        <section className="mt-8">
          <h2 className="font-heading text-2xl text-[#1B365D]">Payment methods</h2>
          {methods.length === 0 ? (
            <EmptyNote>No completed sales to break down by payment method.</EmptyNote>
          ) : (
            <div className="mt-4 overflow-x-auto border border-[#1B365D]/10 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1B365D]/10">
                    <th className="px-4 pb-3 pt-4 text-left text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Method</th>
                    <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Sales</th>
                    <th className="px-4 pb-3 pt-4 text-right text-xs font-normal uppercase tracking-widest text-[#1B365D]/40">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B365D]/5">
                  {methods.map((row) => (
                    <tr key={row.method}>
                      <td className="px-4 py-3 capitalize text-[#1B365D]">{row.method.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 text-right text-[#1B365D]/80">{row.count}</td>
                      <td className="px-4 py-3 text-right text-[#1B365D]">{money(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </ReportShell>
  );
}
