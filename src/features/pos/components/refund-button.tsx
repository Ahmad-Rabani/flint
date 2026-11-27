"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RefundButton({ id, receiptNumber }: { id: string; receiptNumber: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function refund() {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/pos/sales/${id}/refund`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(body?.error || "Refund failed");
        return;
      }
      toast.success(`${receiptNumber} refunded`);
      setConfirming(false);
      router.refresh();
    } catch {
      toast.error("Refund failed");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex min-h-11 items-center border border-[#1B365D]/20 px-3 text-sm text-[#1B365D] transition-colors hover:border-copper hover:text-copper"
      >
        Refund
      </button>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => void refund()}
        className="inline-flex min-h-11 items-center bg-[#1B365D] px-3 text-sm text-ivory disabled:opacity-50"
      >
        {pending ? "Refunding…" : "Confirm"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="inline-flex min-h-11 items-center border border-[#1B365D]/20 px-3 text-sm text-[#1B365D]"
      >
        Cancel
      </button>
    </div>
  );
}
