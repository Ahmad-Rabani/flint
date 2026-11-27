"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";

type Product = { id: string; name: string; sku: string };
type Props = {
  collection?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    productIds: string[];
    isFeatured: boolean;
    isActive: boolean;
    sortOrder: number;
  };
  products: Product[];
};

export function CollectionForm({ collection, products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(collection?.name ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [productIds, setProductIds] = useState<string[]>(collection?.productIds ?? []);
  const [isFeatured, setIsFeatured] = useState(collection?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(collection?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(String(collection?.sortOrder ?? 0));
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function handleNameChange(value: string) {
    setName(value);
    if (!collection) setSlug(slugify(value));
  }

  function toggleProduct(id: string) {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name, slug,
          description: description || undefined,
          productIds,
          isFeatured, isActive,
          sortOrder: parseInt(sortOrder) || 0,
        };
        const url = collection ? `/api/admin/collections/${collection.id}` : "/api/admin/collections";
        const method = collection ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Save failed");
        toast.success(collection ? "Collection updated" : "Collection created");
        if (!collection) router.push("/admin/collections");
        else router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  const inputCls = "w-full border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#1B365D]/50 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <label className={labelCls}>Name *</label>
          <input className={inputCls} value={name} onChange={(e) => handleNameChange(e.target.value)} required placeholder="Summer Essentials" />
        </div>
        <div>
          <label className={labelCls}>Slug</label>
          <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea className={`${inputCls} h-24 resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {/* Products selector */}
        <div>
          <label className={labelCls}>Products ({productIds.length} selected)</label>
          <input
            className={`${inputCls} mb-2`}
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto border border-[#1B365D]/10 divide-y divide-[#1B365D]/5">
            {filteredProducts.length === 0 && (
              <p className="p-4 text-xs text-[#1B365D]/30">No products found.</p>
            )}
            {filteredProducts.map((p) => (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#1B365D]/[0.02] transition-colors">
                <input type="checkbox" className="accent-copper" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                <div className="min-w-0">
                  <p className="text-sm text-[#1B365D]">{p.name}</p>
                  <p className="font-mono text-xs text-[#1B365D]/40">{p.sku}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="border border-[#1B365D]/10 bg-white p-5">
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-[#1B365D]/40">Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-copper" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              <span className="text-sm text-[#1B365D]">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-copper" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm text-[#1B365D]">Active</span>
            </label>
            <div>
              <label className={labelCls}>Sort Order</label>
              <input type="number" className={inputCls} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="mt-5 w-full border border-[#1B365D] bg-[#1B365D] py-2.5 text-sm text-ivory hover:bg-[#1B365D]/90 transition-colors disabled:opacity-60"
          >
            {isPending ? "Saving…" : collection ? "Save Changes" : "Create Collection"}
          </button>
          <a href="/admin/collections" className="mt-2 block text-center text-xs text-[#1B365D]/40 hover:text-[#1B365D] transition-colors">
            Cancel
          </a>
        </div>
      </div>
    </form>
  );
}
