"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  placement: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};

const EMPTY: Omit<Banner, "id"> = {
  title: "", subtitle: null, placement: "home_hero", ctaLabel: null, ctaHref: null,
  isActive: true, sortOrder: 0, startsAt: null, endsAt: null,
};

export function BannerManager({ banners: initial }: { banners: Banner[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Omit<Banner, "id">>(EMPTY);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(banner: Banner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      placement: banner.placement,
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      startsAt: banner.startsAt,
      endsAt: banner.endsAt,
    });
    setShowNew(false);
  }

  function startNew() {
    setShowNew(true);
    setEditingId(null);
    setForm(EMPTY);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const url = editingId ? `/api/admin/cms/banners/${editingId}` : "/api/admin/cms/banners";
        const method = editingId ? "PATCH" : "POST";
        const payload = {
          title: form.title,
          subtitle: form.subtitle || undefined,
          placement: form.placement,
          ctaLabel: form.ctaLabel || undefined,
          ctaHref: form.ctaHref || undefined,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
          startsAt: form.startsAt || undefined,
          endsAt: form.endsAt || undefined,
        };
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Save failed");
        toast.success(editingId ? "Banner updated" : "Banner created");
        setEditingId(null);
        setShowNew(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete banner "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/cms/banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Banner deleted");
      if (editingId === id) setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Delete failed");
    }
  }

  const inputCls = "w-full border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#1B365D]/50 mb-1.5";

  const BannerForm = () => (
    <div className="border border-[#1B365D]/10 bg-white p-5 mt-4 space-y-4">
      <h3 className="text-xs uppercase tracking-[0.2em] text-[#1B365D]/40">
        {editingId ? "Edit Banner" : "New Banner"}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Title *</label>
          <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="Summer Collection" />
        </div>
        <div>
          <label className={labelCls}>Subtitle</label>
          <input className={inputCls} value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value || null)} />
        </div>
        <div>
          <label className={labelCls}>Placement</label>
          <select className={inputCls} value={form.placement} onChange={(e) => set("placement", e.target.value)}>
            <option value="home_hero">Home Hero</option>
            <option value="home_secondary">Home Secondary</option>
            <option value="catalogue">Catalogue</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Sort Order</label>
          <input type="number" className={inputCls} value={form.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelCls}>CTA Label</label>
          <input className={inputCls} value={form.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value || null)} placeholder="Shop Now" />
        </div>
        <div>
          <label className={labelCls}>CTA Link</label>
          <input className={inputCls} value={form.ctaHref ?? ""} onChange={(e) => set("ctaHref", e.target.value || null)} placeholder="/catalogue" />
        </div>
        <div>
          <label className={labelCls}>Starts At</label>
          <input type="datetime-local" className={inputCls} value={form.startsAt ? form.startsAt.slice(0, 16) : ""} onChange={(e) => set("startsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} />
        </div>
        <div>
          <label className={labelCls}>Ends At</label>
          <input type="datetime-local" className={inputCls} value={form.endsAt ? form.endsAt.slice(0, 16) : ""} onChange={(e) => set("endsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="accent-copper" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
        <span className="text-sm text-[#1B365D]">Active</span>
      </label>
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isPending || !form.title}
          className="border border-[#1B365D] bg-[#1B365D] px-5 py-2 text-sm text-ivory hover:bg-[#1B365D]/90 transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save Banner"}
        </button>
        <button
          onClick={() => { setEditingId(null); setShowNew(false); }}
          className="border border-[#1B365D]/20 px-5 py-2 text-sm text-[#1B365D]/60 hover:border-[#1B365D]/40 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <button onClick={startNew} className="border border-[#1B365D] bg-[#1B365D] px-4 py-2 text-sm text-ivory hover:bg-[#1B365D]/90 transition-colors">
          + New Banner
        </button>
      </div>

      {showNew && <BannerForm />}

      <div className="border border-[#1B365D]/10 bg-white overflow-x-auto">
        {initial.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#1B365D]/30">No banners yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1B365D]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">Title</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">Placement</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#1B365D]/40">Active</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#1B365D]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B365D]/5">
              {initial.map((banner) => (
                <React.Fragment key={banner.id}>
                  <tr className="hover:bg-[#1B365D]/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1B365D]">{banner.title}</p>
                      {banner.subtitle && <p className="text-xs text-[#1B365D]/40">{banner.subtitle}</p>}
                    </td>
                    <td className="px-4 py-3 capitalize text-[#1B365D]/60">{banner.placement.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${banner.isActive ? "text-green-600" : "text-[#1B365D]/30"}`}>
                        {banner.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-3">
                      <button onClick={() => startEdit(banner)} className="text-xs text-copper/60 hover:text-copper transition-colors">Edit</button>
                      <button onClick={() => handleDelete(banner.id, banner.title)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                    </td>
                  </tr>
                  {editingId === banner.id && (
                    <tr>
                      <td colSpan={4} className="px-4 pb-4">
                        <BannerForm />
                      </td>
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
