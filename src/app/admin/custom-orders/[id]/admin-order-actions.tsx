"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CUSTOM_ORDER_STATUSES, type CustomOrderStatus } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  more_info_required: "More Info Required",
  quotation_sent: "Quotation Sent",
  awaiting_customer_approval: "Awaiting Customer Approval",
  approved: "Approved",
  payment_pending: "Payment Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  quality_check: "Quality Check",
  ready: "Ready",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

type QuotationData = {
  id: string;
  quotationNumber: string;
  amount: number;
  currency: string;
  message?: string;
  validUntil?: string;
  status: string;
  sentAt?: string;
  depositAmount?: number;
  estimatedDays?: number;
};

type Props = {
  orderId: string;
  currentStatus: string;
  hasQuotation: boolean;
  quotation?: QuotationData;
};

export function AdminOrderActions({ orderId, currentStatus, hasQuotation, quotation }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Status update
  const [newStatus, setNewStatus] = useState<CustomOrderStatus>(
    currentStatus as CustomOrderStatus,
  );
  const [internalNote, setInternalNote] = useState("");

  // Quotation form
  const [showQuotForm, setShowQuotForm] = useState(false);
  const [quotAmount, setQuotAmount] = useState("");
  const [quotDeposit, setQuotDeposit] = useState("");
  const [quotMessage, setQuotMessage] = useState("");
  const [quotValidUntil, setQuotValidUntil] = useState("");
  const [quotDays, setQuotDays] = useState("");
  const [quotMarkSent, setQuotMarkSent] = useState(true);

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus !== currentStatus ? newStatus : undefined,
          internalNote: internalNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success("Order updated");
      setInternalNote("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateQuotation(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !quotAmount) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}/quotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(quotAmount),
          depositAmount: quotDeposit ? Number(quotDeposit) : undefined,
          message: quotMessage.trim() || undefined,
          validUntil: quotValidUntil || undefined,
          estimatedDays: quotDays ? Number(quotDays) : undefined,
          markAsSent: quotMarkSent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create quotation");
      toast.success(`Quotation ${data.quotationNumber} created`);
      setShowQuotForm(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Status + Note */}
      <div className="border border-white/10 bg-white/5 p-6">
        <h3 className="mb-5 text-xs uppercase tracking-[0.2em] text-copper/80">Update Status</h3>
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-white/40">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as CustomOrderStatus)}
              className="w-full border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-ivory outline-none focus:border-copper/60"
            >
              {CUSTOM_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/40">
              Internal note (optional)
            </label>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={3}
              placeholder="Add a note visible only to staff…"
              className="w-full resize-none border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-ivory placeholder-white/20 outline-none focus:border-copper/60"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className={cn(
              "w-full bg-copper py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors",
              busy ? "opacity-60 cursor-not-allowed" : "hover:bg-[#c97d58]",
            )}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Quotation */}
      <div className="border border-white/10 bg-white/5 p-6">
        <h3 className="mb-5 text-xs uppercase tracking-[0.2em] text-copper/80">Quotation</h3>

        {quotation ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/40">{quotation.quotationNumber}</span>
              <span
                className={cn(
                  "text-xs capitalize px-2 py-0.5",
                  quotation.status === "sent"
                    ? "text-copper bg-copper/10"
                    : quotation.status === "accepted"
                      ? "text-green-400 bg-green-400/10"
                      : "text-white/40 bg-white/5",
                )}
              >
                {quotation.status}
              </span>
            </div>
            <p className="font-heading text-2xl text-ivory">
              {formatCurrency(quotation.amount, quotation.currency)}
            </p>
            {quotation.depositAmount && quotation.depositAmount > 0 && (
              <p className="text-xs text-white/40">
                Deposit: {formatCurrency(quotation.depositAmount, quotation.currency)}
              </p>
            )}
            {quotation.validUntil && (
              <p className="text-xs text-white/40">
                Valid until {formatDate(quotation.validUntil)}
              </p>
            )}
            {quotation.message && (
              <p className="mt-2 text-xs text-white/50 leading-relaxed">{quotation.message}</p>
            )}
          </div>
        ) : showQuotForm ? (
          <form onSubmit={handleCreateQuotation} className="space-y-4">
            <FormField label="Amount (USD) *">
              <input
                type="number"
                min={1}
                required
                value={quotAmount}
                onChange={(e) => setQuotAmount(e.target.value)}
                placeholder="e.g. 850"
                className="w-full border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-ivory placeholder-white/20 outline-none focus:border-copper/60"
              />
            </FormField>
            <FormField label="Deposit amount (optional)">
              <input
                type="number"
                min={0}
                value={quotDeposit}
                onChange={(e) => setQuotDeposit(e.target.value)}
                placeholder="e.g. 250"
                className="w-full border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-ivory placeholder-white/20 outline-none focus:border-copper/60"
              />
            </FormField>
            <FormField label="Estimated days (optional)">
              <input
                type="number"
                min={1}
                value={quotDays}
                onChange={(e) => setQuotDays(e.target.value)}
                placeholder="e.g. 28"
                className="w-full border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-ivory placeholder-white/20 outline-none focus:border-copper/60"
              />
            </FormField>
            <FormField label="Valid until (optional)">
              <input
                type="date"
                value={quotValidUntil}
                onChange={(e) => setQuotValidUntil(e.target.value)}
                className="w-full border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-ivory outline-none focus:border-copper/60 [color-scheme:dark]"
              />
            </FormField>
            <FormField label="Message to customer (optional)">
              <textarea
                value={quotMessage}
                onChange={(e) => setQuotMessage(e.target.value)}
                rows={4}
                placeholder="Explain the quote, timeline, any caveats…"
                className="w-full resize-none border border-white/15 bg-[#1a1a1a] px-3 py-2.5 text-sm text-ivory placeholder-white/20 outline-none focus:border-copper/60"
              />
            </FormField>
            <label className="flex cursor-pointer items-center gap-3 text-xs text-white/50">
              <input
                type="checkbox"
                checked={quotMarkSent}
                onChange={(e) => setQuotMarkSent(e.target.checked)}
                className="accent-copper"
              />
              Mark as sent immediately
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={busy || !quotAmount}
                className={cn(
                  "flex-1 bg-copper py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors",
                  busy || !quotAmount ? "opacity-60 cursor-not-allowed" : "hover:bg-[#c97d58]",
                )}
              >
                {busy ? "Creating…" : "Create Quotation"}
              </button>
              <button
                type="button"
                onClick={() => setShowQuotForm(false)}
                className="px-4 text-xs text-white/30 hover:text-white/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="mb-4 text-xs text-white/35">No quotation yet.</p>
            <button
              onClick={() => setShowQuotForm(true)}
              className="w-full border border-copper/30 py-3 text-xs uppercase tracking-[0.2em] text-copper transition-colors hover:bg-copper/10"
            >
              + Create Quotation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-white/40">{label}</label>
      {children}
    </div>
  );
}
