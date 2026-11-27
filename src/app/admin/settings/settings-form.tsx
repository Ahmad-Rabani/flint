"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PaymentMethod = { id: string; label: string; enabled: boolean };
type Settings = {
  businessName: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  currency: string;
  taxRate: number;
  taxInclusive: boolean;
  paymentMethods: PaymentMethod[];
  shipping: { flatRate: number; freeOver: number; estimatedDaysMin: number; estimatedDaysMax: number };
  notifications: { orderEmail: boolean; lowStockEmail: boolean; customOrderEmail: boolean };
  seo: { defaultTitle: string | null; defaultDescription: string | null };
  address: { line1: string | null; line2: string | null; city: string | null; state: string | null; postalCode: string | null; country: string | null };
};

export function SettingsForm({ settings: initial }: { settings: Settings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [s, setS] = useState(initial);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  function togglePaymentMethod(id: string, enabled: boolean) {
    setS((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map((pm) => pm.id === id ? { ...pm, enabled } : pm),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: s.businessName,
            legalName: s.legalName || undefined,
            email: s.email || undefined,
            phone: s.phone || undefined,
            currency: s.currency,
            taxRate: s.taxRate,
            taxInclusive: s.taxInclusive,
            paymentMethods: s.paymentMethods,
            shipping: s.shipping,
            notifications: s.notifications,
            seo: { defaultTitle: s.seo.defaultTitle || undefined, defaultDescription: s.seo.defaultDescription || undefined },
            address: {
              line1: s.address.line1 || undefined,
              line2: s.address.line2 || undefined,
              city: s.address.city || undefined,
              state: s.address.state || undefined,
              postalCode: s.address.postalCode || undefined,
              country: s.address.country || undefined,
            },
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Save failed");
        }
        toast.success("Settings saved");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  const inputCls = "w-full border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#1B365D]/50 mb-1.5";

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border border-[#1B365D]/10 bg-white p-5">
      <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-[#1B365D]/40">{title}</h3>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-3xl space-y-6">
      <Section title="Business">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Business Name</label>
            <input className={inputCls} value={s.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Legal Name</label>
            <input className={inputCls} value={s.legalName ?? ""} onChange={(e) => set("legalName", e.target.value || null)} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={s.email ?? ""} onChange={(e) => set("email", e.target.value || null)} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={s.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} />
          </div>
        </div>
      </Section>

      <Section title="Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Address Line 1</label>
            <input className={inputCls} value={s.address.line1 ?? ""} onChange={(e) => set("address", { ...s.address, line1: e.target.value || null })} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Address Line 2</label>
            <input className={inputCls} value={s.address.line2 ?? ""} onChange={(e) => set("address", { ...s.address, line2: e.target.value || null })} />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input className={inputCls} value={s.address.city ?? ""} onChange={(e) => set("address", { ...s.address, city: e.target.value || null })} />
          </div>
          <div>
            <label className={labelCls}>State / Province</label>
            <input className={inputCls} value={s.address.state ?? ""} onChange={(e) => set("address", { ...s.address, state: e.target.value || null })} />
          </div>
          <div>
            <label className={labelCls}>Postal Code</label>
            <input className={inputCls} value={s.address.postalCode ?? ""} onChange={(e) => set("address", { ...s.address, postalCode: e.target.value || null })} />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input className={inputCls} value={s.address.country ?? ""} onChange={(e) => set("address", { ...s.address, country: e.target.value || null })} />
          </div>
        </div>
      </Section>

      <Section title="Currency & Tax">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Currency (ISO code)</label>
            <input className={`${inputCls} uppercase font-mono`} value={s.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <div>
            <label className={labelCls}>Tax Rate (%)</label>
            <input type="number" step="0.01" min="0" max="100" className={inputCls} value={s.taxRate} onChange={(e) => set("taxRate", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-copper" checked={s.taxInclusive} onChange={(e) => set("taxInclusive", e.target.checked)} />
              <span className="text-sm text-[#1B365D]">Tax Inclusive</span>
            </label>
          </div>
        </div>
      </Section>

      <Section title="Shipping">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Flat Rate</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={s.shipping.flatRate} onChange={(e) => set("shipping", { ...s.shipping, flatRate: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelCls}>Free Shipping Over</label>
            <input type="number" step="0.01" min="0" className={inputCls} value={s.shipping.freeOver} onChange={(e) => set("shipping", { ...s.shipping, freeOver: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelCls}>Estimated Days (Min)</label>
            <input type="number" min="0" className={inputCls} value={s.shipping.estimatedDaysMin} onChange={(e) => set("shipping", { ...s.shipping, estimatedDaysMin: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={labelCls}>Estimated Days (Max)</label>
            <input type="number" min="0" className={inputCls} value={s.shipping.estimatedDaysMax} onChange={(e) => set("shipping", { ...s.shipping, estimatedDaysMax: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
      </Section>

      <Section title="Payment Methods">
        <div className="space-y-3">
          {s.paymentMethods.map((pm) => (
            <label key={pm.id} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="accent-copper" checked={pm.enabled} onChange={(e) => togglePaymentMethod(pm.id, e.target.checked)} />
              <span className="text-sm text-[#1B365D]">{pm.label}</span>
              <span className="font-mono text-xs text-[#1B365D]/30">({pm.id})</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Notifications">
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copper" checked={s.notifications.orderEmail} onChange={(e) => set("notifications", { ...s.notifications, orderEmail: e.target.checked })} />
            <span className="text-sm text-[#1B365D]">Email on new orders</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copper" checked={s.notifications.lowStockEmail} onChange={(e) => set("notifications", { ...s.notifications, lowStockEmail: e.target.checked })} />
            <span className="text-sm text-[#1B365D]">Email on low stock</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copper" checked={s.notifications.customOrderEmail} onChange={(e) => set("notifications", { ...s.notifications, customOrderEmail: e.target.checked })} />
            <span className="text-sm text-[#1B365D]">Email on new custom orders</span>
          </label>
        </div>
      </Section>

      <Section title="SEO">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Default SEO Title</label>
            <input className={inputCls} value={s.seo.defaultTitle ?? ""} onChange={(e) => set("seo", { ...s.seo, defaultTitle: e.target.value || null })} />
          </div>
          <div>
            <label className={labelCls}>Default SEO Description</label>
            <textarea className={`${inputCls} h-20 resize-y`} value={s.seo.defaultDescription ?? ""} onChange={(e) => set("seo", { ...s.seo, defaultDescription: e.target.value || null })} />
          </div>
        </div>
      </Section>

      <div>
        <button type="submit" disabled={isPending} className="border border-[#1B365D] bg-[#1B365D] px-6 py-3 text-sm text-ivory hover:bg-[#1B365D]/90 transition-colors disabled:opacity-60">
          {isPending ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
