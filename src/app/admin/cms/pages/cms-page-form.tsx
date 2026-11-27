"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";

type Props = {
  page?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    isPublished: boolean;
  };
};

export function CMSPageForm({ page }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [content, setContent] = useState(page?.content ?? "");
  const [seoTitle, setSeoTitle] = useState(page?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(page?.seoDescription ?? "");
  const [isPublished, setIsPublished] = useState(page?.isPublished ?? false);

  function handleNameChange(value: string) {
    setTitle(value);
    if (!page) setSlug(slugify(value));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const url = page ? `/api/admin/cms/pages/${page.id}` : "/api/admin/cms/pages";
        const method = page ? "PATCH" : "POST";
        const payload = { title, slug, content, seoTitle: seoTitle || undefined, seoDescription: seoDescription || undefined, isPublished };
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Save failed");
        toast.success(page ? "Page updated" : "Page created");
        if (!page) router.push(`/admin/cms/pages/${result.id}`);
        else router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  const inputCls = "w-full border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#1B365D]/50 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-3xl space-y-5">
      <div>
        <label className={labelCls}>Title *</label>
        <input className={inputCls} value={title} onChange={(e) => handleNameChange(e.target.value)} required placeholder="Terms & Conditions" />
      </div>
      <div>
        <label className={labelCls}>Slug</label>
        <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="terms-conditions" />
      </div>
      <div>
        <label className={labelCls}>Content *</label>
        <textarea className={`${inputCls} min-h-80 resize-y font-mono text-xs`} value={content} onChange={(e) => setContent(e.target.value)} required placeholder="Markdown or HTML content…" />
        <p className="mt-1 text-xs text-[#1B365D]/30">Supports basic HTML or Markdown.</p>
      </div>
      <div>
        <label className={labelCls}>SEO Title</label>
        <input className={inputCls} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>SEO Description</label>
        <textarea className={`${inputCls} h-20 resize-y`} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="accent-copper" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        <span className="text-sm text-[#1B365D]">Published (visible on site)</span>
      </label>
      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="border border-[#1B365D] bg-[#1B365D] px-5 py-2.5 text-sm text-ivory hover:bg-[#1B365D]/90 transition-colors disabled:opacity-60">
          {isPending ? "Saving…" : page ? "Save Changes" : "Create Page"}
        </button>
        <a href="/admin/cms/pages" className="border border-[#1B365D]/20 px-5 py-2.5 text-sm text-[#1B365D]/60 hover:border-[#1B365D]/40 transition-colors">Cancel</a>
      </div>
    </form>
  );
}
