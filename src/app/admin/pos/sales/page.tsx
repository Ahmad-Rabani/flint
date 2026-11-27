export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { listPosSales } from "@/features/pos/queries";
import { PosSubnav } from "@/features/pos/components/pos-subnav";
import { PosPager, PosSalesTable } from "@/features/pos/components/sales-table";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = { searchParams: Promise<{ q?: string; status?: string; page?: string }> };

const STATUSES = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "refunded", label: "Refunded" },
] as const;

function salesHref(q: string, status: string, page?: number) {
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (status && status !== "all") search.set("status", status);
  if (page && page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `/admin/pos/sales?${qs}` : "/admin/pos/sales";
}

export default async function PosSalesPage({ searchParams }: Props) {
  await requireAdminSession("pos.access");
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = STATUSES.some((entry) => entry.value === sp.status) ? (sp.status as (typeof STATUSES)[number]["value"]) : "all";
  const page = Number(sp.page ?? "1");

  await connection();
  const list = await listPosSales({ page, q, status });

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">POS</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Sales History</h1>
      <p className="mt-1 text-sm text-[#1B365D]/50">{list.total} receipts, newest first</p>
      <PosSubnav current="/admin/pos/sales" />

      <form method="GET" className="mt-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Receipt number"
          className="h-11 w-64 border border-[#1B365D]/20 bg-white px-3 text-sm text-[#1B365D] outline-none placeholder:text-[#1B365D]/30 focus:border-copper"
        />
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <button
          type="submit"
          className="inline-flex min-h-11 items-center border border-[#1B365D]/20 px-4 text-sm text-[#1B365D]/70 hover:border-copper hover:text-copper"
        >
          Search
        </button>
        {q && (
          <Link href={salesHref("", status)} className="inline-flex min-h-11 items-center px-2 text-sm text-[#1B365D]/45">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((entry) => (
          <Link
            key={entry.value}
            href={salesHref(q, entry.value)}
            className={cn(
              "inline-flex min-h-11 items-center border px-4 text-sm",
              status === entry.value
                ? "border-[#1B365D] bg-[#1B365D] text-ivory"
                : "border-[#1B365D]/20 text-[#1B365D]/60 hover:border-copper hover:text-copper",
            )}
          >
            {entry.label}
          </Link>
        ))}
      </div>

      <PosSalesTable
        rows={list.items}
        currency={list.currency}
        emptyLabel={q ? "No receipts match that number." : "No POS sales yet. Complete a sale from the register."}
      />
      <PosPager page={list.page} totalPages={list.totalPages} hrefFor={(next) => salesHref(q, status, next)} />
    </div>
  );
}
