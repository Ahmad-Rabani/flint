"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Section = {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  sortOrder: number;
};

export function HomepageSectionForm({ section }: { section: Section }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle);
  const [body, setBody] = useState(section.body);
  const [ctaLabel, setCtaLabel] = useState(section.ctaLabel);
  const [ctaHref, setCtaHref] = useState(section.ctaHref);
  const [isActive, setIsActive] = useState(section.isActive);
  const [sortOrder, setSortOrder] = useState(String(section.sortOrder));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/cms/homepage", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: section.id,
            title: title || undefined,
            subtitle: subtitle || undefined,
            body: body || undefined,
            ctaLabel: ctaLabel || undefined,
            ctaHref: ctaHref || undefined,
            isActive,
            sortOrder: parseInt(sortOrder) || 0,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Save failed");
        toast.success("Section updated");
        router.refresh();
        setIsOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  const inputCls = "w-full border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#1B365D]/50 mb-1.5";

  return (
    <div className="border border-[#1B365D]/10 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`inline-block h-2 w-2 rounded-full ${section.isActive ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="font-medium text-[#1B365D]">{section.key}</span>
          {section.title && <span className="text-sm text-[#1B365D]/50">{section.title}</span>}
        </div>
        <span className="text-[#1B365D]/30 text-sm">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="border-t border-[#1B365D]/10 px-5 py-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Subtitle</label>
              <input className={inputCls} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Body</label>
            <textarea className={`${inputCls} h-24 resize-y`} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>CTA Label</label>
              <input className={inputCls} value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Shop Now" />
            </div>
            <div>
              <label className={labelCls}>CTA Link</label>
              <input className={inputCls} value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} placeholder="/catalogue" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-copper" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm text-[#1B365D]">Active</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#1B365D]/50 uppercase tracking-widest">Order:</label>
              <input type="number" className="w-16 border border-[#1B365D]/20 px-2 py-1 text-sm text-[#1B365D] focus:border-copper focus:outline-none" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="border border-[#1B365D] bg-[#1B365D] px-5 py-2 text-sm text-ivory hover:bg-[#1B365D]/90 transition-colors disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save Section"}
          </button>
        </form>
      )}
    </div>
  );
}
