export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/permissions";
import { listPosSales } from "@/features/pos/queries";
import { PosSubnav } from "@/features/pos/components/pos-subnav";
import { PosPager, PosSalesTable } from "@/features/pos/components/sales-table";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

function refundsHref(q: string, page?: number) {
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (page && page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `/admin/pos/refunds?${qs}` : "/admin/pos/refunds";
}

export default async function PosRefundsPage({ searchParams }: Props) {
  const session = await requireAdminSession("pos.access");
  const canRefund = hasPermission(session, "pos.refund");
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Number(sp.page ?? "1");

  await connection();
  const list = await listPosSales({ page, q, status: "completed" });

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">POS</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">Refunds</h1>
      <p className="mt-1 text-sm text-[#171717]/50">
        Completed register sales. A refund restores stock and marks the payment refunded.
      </p>
      <PosSubnav current="/admin/pos/refunds" />

      <form method="GET" className="mt-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Receipt number"
          className="h-11 w-64 border border-[#171717]/20 bg-white px-3 text-sm text-[#171717] outline-none placeholder:text-[#171717]/30 focus:border-copper"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center border border-[#171717]/20 px-4 text-sm text-[#171717]/70 hover:border-copper hover:text-copper"
        >
          Search
        </button>
        {q && (
          <Link href="/admin/pos/refunds" className="inline-flex min-h-11 items-center px-2 text-sm text-[#171717]/45">
            Clear
          </Link>
        )}
      </form>

      {!canRefund && (
        <p className="mt-4 text-sm text-[#171717]/50">Refunds on this register require the refund permission.</p>
      )}

      <PosSalesTable
        rows={list.items}
        currency={list.currency}
        canRefund={canRefund}
        emptyLabel={q ? "No completed sales match that receipt." : "No completed POS sales to refund."}
      />
      <PosPager page={list.page} totalPages={list.totalPages} hrefFor={(next) => refundsHref(q, next)} />
    </div>
  );
}
