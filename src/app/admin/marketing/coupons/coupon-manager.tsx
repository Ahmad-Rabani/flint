"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

type Coupon = {
  id: string; code: string; description: string | null;
  type: "percentage" | "fixed"; value: number;
  minOrderAmount: number; usageLimit: number | null; usedCount: number;
  isActive: boolean; startsAt: string | null; endsAt: string | null;
};

const EMPTY: {
  code: string; description: string; type: "percentage" | "fixed"; value: string;
  minOrderAmount: string; usageLimit: string; startsAt: string; endsAt: string; isActive: boolean;
} = {
  code: "", description: "", type: "percentage", value: "", minOrderAmount: "", usageLimit: "",
  startsAt: "", endsAt: "", isActive: true,
};

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function startEdit(c: Coupon) {
    setEditId(c.id);
    setForm({
      code: c.code, description: c.description ?? "", type: c.type, value: String(c.value),
      minOrderAmount: String(c.minOrderAmount), usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      startsAt: c.startsAt ? c.startsAt.slice(0, 16) : "", endsAt: c.endsAt ? c.endsAt.slice(0, 16) : "",
      isActive: c.isActive,
    });
    setShowNew(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const url = editId ? `/api/admin/marketing/coupons/${editId}` : "/api/admin/marketing/coupons";
        const method = editId ? "PATCH" : "POST";
        const payload = {
          ...(!editId && { code: form.code.toUpperCase() }),
          description: form.description || undefined,
          type: form.type,
          value: parseFloat(form.value) || 0,
          minOrderAmount: parseFloat(form.minOrderAmount) || 0,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
          isActive: form.isActive,
        };
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Save failed");
        toast.success(editId ? "Coupon updated" : "Coupon created");
        setEditId(null); setShowNew(false);
        router.refresh();
      } catch (err) { toast.error(err instanceof Error ? err.message : "Save failed"); }
    });
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    const res = await fetch(`/api/admin/marketing/coupons/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Delete failed");
    toast.success("Coupon deleted");
    if (editId === id) setEditId(null);
    router.refresh();
  }

  const inputCls = "w-full border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#171717]/50 mb-1.5";

  const Form = () => (
    <div className="border border-[#171717]/10 bg-white p-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {!editId && (
          <div>
            <label className={labelCls}>Code *</label>
            <input className={`${inputCls} uppercase font-mono`} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required placeholder="SUMMER20" />
          </div>
        )}
        <div>
          <label className={labelCls}>Description</label>
          <input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Summer sale discount" />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value as "percentage" | "fixed")}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount ($)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Value *</label>
          <input type="number" step="0.01" min="0" className={inputCls} value={form.value} onChange={(e) => set("value", e.target.value)} required placeholder={form.type === "percentage" ? "20" : "10.00"} />
        </div>
        <div>
          <label className={labelCls}>Min Order Amount</label>
          <input type="number" step="0.01" min="0" className={inputCls} value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className={labelCls}>Usage Limit</label>
          <input type="number" min="1" className={inputCls} value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="Unlimited" />
        </div>
        <div>
          <label className={labelCls}>Starts At</label>
          <input type="datetime-local" className={inputCls} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Expires At</label>
          <input type="datetime-local" className={inputCls} value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="accent-copper" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
        <span className="text-sm text-[#171717]">Active</span>
      </label>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={isPending || (!editId && !form.code) || !form.value} className="border border-[#171717] bg-[#171717] px-5 py-2 text-sm text-ivory hover:bg-[#171717]/90 transition-colors disabled:opacity-60">
          {isPending ? "Saving…" : "Save Coupon"}
        </button>
        <button onClick={() => { setEditId(null); setShowNew(false); }} className="border border-[#171717]/20 px-5 py-2 text-sm text-[#171717]/60 hover:border-[#171717]/40 transition-colors">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => { setShowNew(true); setEditId(null); setForm(EMPTY); }} className="border border-[#171717] bg-[#171717] px-4 py-2 text-sm text-ivory hover:bg-[#171717]/90 transition-colors">
          + New Coupon
        </button>
      </div>
      {showNew && <div className="mb-4"><Form /></div>}

      <div className="border border-[#171717]/10 bg-white overflow-x-auto">
        {coupons.length === 0 && !showNew ? (
          <div className="p-12 text-center text-sm text-[#171717]/30">No coupons yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Code</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Type</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Value</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Used</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Expires</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Active</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {coupons.map((c) => (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-[#171717]/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-[#171717]">{c.code}</td>
                    <td className="px-4 py-3 capitalize text-[#171717]/60">{c.type}</td>
                    <td className="px-4 py-3 text-[#171717]">
                      {c.type === "percentage" ? `${c.value}%` : formatCurrency(c.value)}
                    </td>
                    <td className="px-4 py-3 text-[#171717]/60">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</td>
                    <td className="px-4 py-3 text-xs text-[#171717]/40">{c.endsAt ? formatDate(c.endsAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${c.isActive ? "text-green-600" : "text-[#171717]/30"}`}>{c.isActive ? "Yes" : "No"}</span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-3">
                      <button onClick={() => startEdit(c)} className="text-xs text-copper/60 hover:text-copper transition-colors">Edit</button>
                      <button onClick={() => handleDelete(c.id, c.code)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                    </td>
                  </tr>
                  {editId === c.id && (
                    <tr>
                      <td colSpan={7} className="px-4 pb-4"><Form /></td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
