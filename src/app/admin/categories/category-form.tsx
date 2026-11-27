"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";

type Category = { id: string; name: string; parentId?: string | null };
type Props = {
  category?: Category & {
    slug: string;
    description?: string | null;
    sortOrder: number;
    isActive: boolean;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
  categories: Category[];
};

export function CategoryForm({ category, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [seoTitle, setSeoTitle] = useState(category?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(category?.seoDescription ?? "");

  function handleNameChange(value: string) {
    setName(value);
    if (!category) setSlug(slugify(value));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name,
          slug,
          description: description || undefined,
          parentId: parentId || null,
          sortOrder: parseInt(sortOrder) || 0,
          isActive,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
        };
        const url = category ? `/api/admin/categories/${category.id}` : "/api/admin/categories";
        const method = category ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Save failed");
        toast.success(category ? "Category updated" : "Category created");
        if (!category) router.push("/admin/categories");
        else router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  const inputCls = "w-full border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#171717]/50 mb-1.5";

  // Exclude self from parents
  const parentOptions = categories.filter((c) => c.id !== category?.id);

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-5">
      <div>
        <label className={labelCls}>Name *</label>
        <input className={inputCls} value={name} onChange={(e) => handleNameChange(e.target.value)} required placeholder="Knives" />
      </div>
      <div>
        <label className={labelCls}>Slug</label>
        <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="knives" />
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea className={`${inputCls} h-24 resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>Parent Category</label>
        <select className={inputCls} value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">None (top-level)</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Sort Order</label>
          <input type="number" className={inputCls} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-copper" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm text-[#171717]">Active</span>
          </label>
        </div>
      </div>
      <div>
        <label className={labelCls}>SEO Title</label>
        <input className={inputCls} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
      </div>
      <div>
        <label className={labelCls}>SEO Description</label>
        <textarea className={`${inputCls} h-20 resize-y`} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="border border-[#171717] bg-[#171717] px-5 py-2.5 text-sm text-ivory hover:bg-[#171717]/90 transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving…" : category ? "Save Changes" : "Create Category"}
        </button>
        <a href="/admin/categories" className="border border-[#171717]/20 px-5 py-2.5 text-sm text-[#171717]/60 hover:border-[#171717]/40 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
