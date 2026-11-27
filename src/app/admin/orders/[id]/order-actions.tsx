"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ORDER_STATUSES } from "@/constants";

export function OrderActions({
  orderId,
  currentStatus,
  currentPaymentStatus,
  internalNotes,
}: {
  orderId: string;
  currentStatus: string;
  currentPaymentStatus: string;
  internalNotes?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [notes, setNotes] = useState(internalNotes ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentStatus, internalNotes: notes }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Order updated");
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  }

  const selectCls = "w-full border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] focus:border-copper focus:outline-none";

  return (
    <div className="border border-[#171717]/10 bg-white p-5 space-y-4">
      <h3 className="text-xs uppercase tracking-[0.2em] text-[#171717]/40">Manage Order</h3>
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#171717]/50 mb-1.5">Status</label>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#171717]/50 mb-1.5">Payment Status</label>
        <select className={selectCls} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          {["unpaid", "pending", "paid", "partially_refunded", "refunded", "failed"].map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#171717]/50 mb-1.5">Internal Notes</label>
        <textarea
          className="w-full border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none h-24 resize-y"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes visible only to staff…"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full border border-[#171717] bg-[#171717] py-2.5 text-sm text-ivory hover:bg-[#171717]/90 transition-colors disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
