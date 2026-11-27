import { cn } from "@/lib/utils";
import type { StockStatus } from "@/features/inventory/types";

const STYLES: Record<StockStatus, string> = {
  in: "border-emerald-200 bg-emerald-50 text-emerald-800",
  low: "border-amber-200 bg-amber-50 text-amber-800",
  out: "border-red-200 bg-red-50 text-red-700",
};

const LABELS: Record<StockStatus, string> = {
  in: "In stock",
  low: "Low",
  out: "Out of stock",
};

export function StockBadge({ status, label }: { status: StockStatus; label?: string }) {
  return (
    <span className={cn("inline-block border px-2 py-0.5 text-xs", STYLES[status])}>
      {label ?? LABELS[status]}
    </span>
  );
}
