"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type FAQ = { id: string; question: string; answer: string; category: string | null; sortOrder: number; isActive: boolean };

const EMPTY = { question: "", answer: "", category: "", sortOrder: 0, isActive: true };

export function FAQManager({ faqs }: { faqs: FAQ[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(faq: FAQ) {
    setEditId(faq.id);
    setForm({ question: faq.question, answer: faq.answer, category: faq.category ?? "", sortOrder: faq.sortOrder, isActive: faq.isActive });
    setShowNew(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const url = editId ? `/api/admin/cms/faq/${editId}` : "/api/admin/cms/faq";
        const method = editId ? "PATCH" : "POST";
        const payload = { question: form.question, answer: form.answer, category: form.category || undefined, sortOrder: form.sortOrder, isActive: form.isActive };
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("Save failed");
        toast.success(editId ? "FAQ updated" : "FAQ created");
        setEditId(null); setShowNew(false);
        router.refresh();
      } catch { toast.error("Save failed"); }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    const res = await fetch(`/api/admin/cms/faq/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Delete failed");
    toast.success("FAQ deleted");
    if (editId === id) setEditId(null);
    router.refresh();
  }

  const inputCls = "w-full border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#1B365D]/50 mb-1.5";

  const Form = () => (
    <div className="border border-[#1B365D]/10 bg-white p-5 space-y-4">
      <div>
        <label className={labelCls}>Question *</label>
        <input className={inputCls} value={form.question} onChange={(e) => set("question", e.target.value)} required />
      </div>
      <div>
        <label className={labelCls}>Answer *</label>
        <textarea className={`${inputCls} h-28 resize-y`} value={form.answer} onChange={(e) => set("answer", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Category</label>
          <input className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Shipping, Returns…" />
        </div>
        <div>
          <label className={labelCls}>Sort Order</label>
          <input type="number" className={inputCls} value={form.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="accent-copper" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
        <span className="text-sm text-[#1B365D]">Active</span>
      </label>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={isPending || !form.question || !form.answer} className="border border-[#1B365D] bg-[#1B365D] px-5 py-2 text-sm text-ivory hover:bg-[#1B365D]/90 transition-colors disabled:opacity-60">
          {isPending ? "Saving…" : "Save FAQ"}
        </button>
        <button onClick={() => { setEditId(null); setShowNew(false); }} className="border border-[#1B365D]/20 px-5 py-2 text-sm text-[#1B365D]/60 hover:border-[#1B365D]/40 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <button onClick={() => { setShowNew(true); setEditId(null); setForm(EMPTY); }} className="border border-[#1B365D] bg-[#1B365D] px-4 py-2 text-sm text-ivory hover:bg-[#1B365D]/90 transition-colors">
          + New FAQ
        </button>
      </div>
      {showNew && <div className="mb-4"><Form /></div>}
      <div className="space-y-2">
        {faqs.length === 0 && !showNew && <div className="border border-[#1B365D]/10 bg-white p-12 text-center text-sm text-[#1B365D]/30">No FAQs yet.</div>}
        {faqs.map((faq) => (
          <div key={faq.id}>
            {editId === faq.id ? (
              <Form />
            ) : (
              <div className="border border-[#1B365D]/10 bg-white p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-[#1B365D]">{faq.question}</p>
                  <p className="mt-1 text-sm text-[#1B365D]/50 line-clamp-2">{faq.answer}</p>
                  {faq.category && <p className="mt-1 text-xs text-copper/60">{faq.category}</p>}
                </div>
                <div className="flex gap-3 shrink-0">
                  <button onClick={() => startEdit(faq)} className="text-xs text-copper/60 hover:text-copper transition-colors">Edit</button>
                  <button onClick={() => handleDelete(faq.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
