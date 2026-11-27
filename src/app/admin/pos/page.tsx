export const instant = false;

import { requireAdminSession } from "@/lib/auth/admin";
import { CreditCard, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function AdminPOSPage() {
  await requireAdminSession("pos.access");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center border border-copper/30 bg-copper/10">
        <CreditCard size={28} className="text-copper" />
      </div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Coming Soon</p>
      <h1 className="mt-2 font-heading text-4xl text-[#171717]">POS Checkout</h1>
      <p className="mt-4 max-w-sm text-sm text-[#171717]/50">
        The Point-of-Sale terminal is scheduled for Phase 7. It will support in-person transactions,
        barcode scanning, cash & card payments, and real-time inventory deduction.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 max-w-md w-full text-left">
        <div className="border border-[#171717]/10 bg-white p-5">
          <Package size={16} className="text-copper mb-3" />
          <h3 className="font-medium text-[#171717] text-sm">Inventory Ready</h3>
          <p className="mt-1 text-xs text-[#171717]/50">Stock levels are tracked and ready for POS integration.</p>
        </div>
        <div className="border border-[#171717]/10 bg-white p-5">
          <CreditCard size={16} className="text-copper mb-3" />
          <h3 className="font-medium text-[#171717] text-sm">Products Ready</h3>
          <p className="mt-1 text-xs text-[#171717]/50">Product catalogue and pricing are configured for POS use.</p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/admin/products" className="flex items-center gap-2 border border-[#171717] bg-[#171717] px-5 py-2.5 text-sm text-ivory hover:bg-[#171717]/90 transition-colors">
          Manage Products <ArrowRight size={14} />
        </Link>
        <Link href="/admin/inventory" className="flex items-center gap-2 border border-[#171717]/20 px-5 py-2.5 text-sm text-[#171717]/60 hover:border-[#171717]/40 transition-colors">
          View Inventory <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
