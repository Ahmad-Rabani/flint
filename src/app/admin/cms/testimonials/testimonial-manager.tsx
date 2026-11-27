"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Testimonial = { id: string; authorName: string; authorTitle: string | null; quote: string; rating: number; isFeatured: boolean; isActive: boolean; sortOrder: number };

const EMPTY = { authorName: "", authorTitle: "", quote: "", rating: 5, isFeatured: true, isActive: true, sortOrder: 0 };

export function TestimonialManager({ testimonials }: { testimonials: Testimonial[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function startEdit(t: Testimonial) {
    setEditId(t.id);
    setForm({ authorName: t.authorName, authorTitle: t.authorTitle ?? "", quote: t.quote, rating: t.rating, isFeatured: t.isFeatured, isActive: t.isActive, sortOrder: t.sortOrder });
    setShowNew(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const url = editId ? `/api/admin/cms/testimonials/${editId}` : "/api/admin/cms/testimonials";
        const method = editId ? "PATCH" : "POST";
        const payload = { authorName: form.authorName, authorTitle: form.authorTitle || undefined, quote: form.quote, rating: form.rating, isFeatured: form.isFeatured, isActive: form.isActive, sortOrder: form.sortOrder };
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("Save failed");
        toast.success(editId ? "Testimonial updated" : "Testimonial created");
        setEditId(null); setShowNew(false);
        router.refresh();
      } catch { toast.error("Save failed"); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    const res = await fetch(`/api/admin/cms/testimonials/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Delete failed");
    toast.success("Testimonial deleted");
    if (editId === id) setEditId(null);
    router.refresh();
  }

  const inputCls = "w-full border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#171717]/50 mb-1.5";

  const Form = () => (
    <div className="border border-[#171717]/10 bg-white p-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Author Name *</label>
          <input className={inputCls} value={form.authorName} onChange={(e) => set("authorName", e.target.value)} required placeholder="Jane Smith" />
        </div>
        <div>
          <label className={labelCls}>Author Title</label>
          <input className={inputCls} value={form.authorTitle} onChange={(e) => set("authorTitle", e.target.value)} placeholder="Master Chef" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Quote *</label>
        <textarea className={`${inputCls} h-24 resize-y`} value={form.quote} onChange={(e) => set("quote", e.target.value)} required />
      </div>
      <div className="flex items-center gap-6">
        <div>
          <label className={labelCls}>Rating</label>
          <select className="border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] focus:border-copper focus:outline-none" value={form.rating} onChange={(e) => set("rating", parseInt(e.target.value))}>
            {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} ★</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-copper" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
          <span className="text-sm text-[#171717]">Featured</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-copper" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          <span className="text-sm text-[#171717]">Active</span>
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={isPending || !form.authorName || !form.quote} className="border border-[#171717] bg-[#171717] px-5 py-2 text-sm text-ivory hover:bg-[#171717]/90 transition-colors disabled:opacity-60">
          {isPending ? "Saving…" : "Save"}
        </button>
        <button onClick={() => { setEditId(null); setShowNew(false); }} className="border border-[#171717]/20 px-5 py-2 text-sm text-[#171717]/60 hover:border-[#171717]/40 transition-colors">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => { setShowNew(true); setEditId(null); setForm(EMPTY); }} className="border border-[#171717] bg-[#171717] px-4 py-2 text-sm text-ivory hover:bg-[#171717]/90 transition-colors">
          + New Testimonial
        </button>
      </div>
      {showNew && <div className="mb-4"><Form /></div>}
      <div className="space-y-2">
        {testimonials.length === 0 && !showNew && <div className="border border-[#171717]/10 bg-white p-12 text-center text-sm text-[#171717]/30">No testimonials yet.</div>}
        {testimonials.map((t) => (
          <div key={t.id}>
            {editId === t.id ? <Form /> : (
              <div className="border border-[#171717]/10 bg-white p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-[#171717]">{t.authorName}{t.authorTitle && <span className="text-sm font-normal text-[#171717]/50"> · {t.authorTitle}</span>}</p>
                  <p className="text-copper text-sm">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</p>
                  <p className="mt-1 text-sm text-[#171717]/60 line-clamp-2">{t.quote}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => startEdit(t)} className="text-xs text-copper/60 hover:text-copper transition-colors">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
