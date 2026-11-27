import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { PAYMENT_LABELS } from "@/features/pos/pricing";
import type { PosSaleRow } from "@/features/pos/types";
import { RefundButton } from "@/features/pos/components/refund-button";

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const STATUS_CLASS: Record<PosSaleRow["status"], string> = {
  completed: "bg-emerald-50 text-emerald-800",
  refunded: "bg-[#1B365D]/5 text-[#1B365D]/55",
  voided: "bg-red-50 text-red-700",
};

export function PosSalesTable({
  rows,
  currency,
  emptyLabel,
  canRefund = false,
}: {
  rows: PosSaleRow[];
  currency: string;
  emptyLabel: string;
  canRefund?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-5 border border-[#1B365D]/10 bg-white p-12 text-center text-sm text-[#1B365D]/45">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto border border-[#1B365D]/10 bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-[#1B365D]/10">
            {["Receipt", "When", "Customer", "Cashier", "Method", "Items", "Total", ""].map((label) => (
              <th
                key={label || "action"}
                className={cn(
                  "px-4 pb-3 pt-4 text-xs font-normal uppercase tracking-widest text-[#1B365D]/40",
                  label === "Total" || label === "" ? "text-right" : "text-left",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1B365D]/5">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-[#1B365D]/[0.02]">
              <td className="px-4 py-3">
                <Link href={`/admin/pos/sales/${row.id}`} className="font-medium text-[#1B365D] hover:text-copper">
                  {row.receiptNumber}
                </Link>
                <span className={cn("ml-2 rounded-sm px-2 py-0.5 text-[11px] capitalize", STATUS_CLASS[row.status])}>
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[#1B365D]/55">{formatWhen(row.createdAt)}</td>
              <td className="px-4 py-3 text-[#1B365D]/75">{row.customerName}</td>
              <td className="px-4 py-3 text-[#1B365D]/55">{row.cashierName}</td>
              <td className="px-4 py-3 text-[#1B365D]/70">{PAYMENT_LABELS[row.paymentMethod]}</td>
              <td className="px-4 py-3 text-[#1B365D]/55">{row.itemCount}</td>
              <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.total, currency)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {canRefund && row.status === "completed" && (
                    <RefundButton id={row.id} receiptNumber={row.receiptNumber} />
                  )}
                  <Link
                    href={`/admin/pos/sales/${row.id}`}
                    className="inline-flex min-h-11 items-center px-2 text-sm text-copper/80 hover:text-copper"
                  >
                    Receipt
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PosPager({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let current = start; current <= end; current += 1) pages.push(current);

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {pages.map((current) => (
        <Link
          key={current}
          href={hrefFor(current)}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center border px-3 text-sm transition-colors",
            current === page
              ? "border-[#1B365D] bg-[#1B365D] text-ivory"
              : "border-[#1B365D]/20 text-[#1B365D]/60 hover:border-copper hover:text-copper",
          )}
        >
          {current}
        </Link>
      ))}
    </div>
  );
}
