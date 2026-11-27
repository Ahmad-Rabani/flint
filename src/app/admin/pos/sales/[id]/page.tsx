export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { getPosReceipt } from "@/features/pos/queries";
import { PosSubnav } from "@/features/pos/components/pos-subnav";
import { PrintableReceipt } from "@/features/pos/components/printable-receipt";
import { PrintButton } from "@/features/pos/components/print-button";

type Props = { params: Promise<{ id: string }> };

export default async function PosReceiptPage({ params }: Props) {
  await requireAdminSession("pos.access");
  const { id } = await params;
  await connection();
  const receipt = await getPosReceipt(id);
  if (!receipt) notFound();

  return (
    <div>
      <div className="no-print">
        <p className="text-xs uppercase tracking-[0.3em] text-copper/70">POS</p>
        <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Receipt</h1>
        <p className="mt-1 text-sm text-[#1B365D]/50">{receipt.receiptNumber}</p>
        <PosSubnav current="/admin/pos/sales" />
        <div className="mt-5 flex flex-wrap gap-3">
          <PrintButton />
          <Link
            href="/admin/pos"
            className="inline-flex min-h-11 items-center border border-[#1B365D]/20 px-5 text-sm text-[#1B365D] hover:border-copper hover:text-copper"
          >
            New sale
          </Link>
          {receipt.orderId && (
            <Link
              href={`/admin/orders/${receipt.orderId}`}
              className="inline-flex min-h-11 items-center px-2 text-sm text-copper"
            >
              View order
            </Link>
          )}
        </div>
      </div>
      <div className="mt-8">
        <PrintableReceipt receipt={receipt} />
      </div>
    </div>
  );
}
