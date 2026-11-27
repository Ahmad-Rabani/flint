"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import {
  ProductImageUploader,
  type ProductImageRef,
} from "@/components/admin/product-image-uploader";

type Category = { id: string; name: string };
type Spec = { label: string; value: string };
type ImageRef = ProductImageRef;

type FormData = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  description: string;
  shortDescription: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  stock: string;
  minStockLevel: string;
  status: string;
  categoryIds: string[];
  badges: string;
  materials: string;
  specifications: Spec[];
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isCustomizable: boolean;
  images: ImageRef[];
  seoTitle: string;
  seoDescription: string;
};

type Props = {
  product?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    barcode?: string;
    description: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    costPrice: number;
    stock: number;
    minStockLevel: number;
    status: string;
    categoryIds: string[];
    badges: string[];
    materials: string[];
    specifications: { label: string; value: string }[];
    isFeatured: boolean;
    isBestseller: boolean;
    isNewArrival: boolean;
    isCustomizable: boolean;
    images: ImageRef[];
    seoTitle?: string;
    seoDescription?: string;
  };
  categories: Category[];
};

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState<FormData>({
    id: product?.id,
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    description: product?.description ?? "",
    shortDescription: product?.shortDescription ?? "",
    price: product ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : "",
    costPrice: product ? String(product.costPrice) : "",
    stock: product ? String(product.stock) : "0",
    minStockLevel: product ? String(product.minStockLevel) : "5",
    status: product?.status ?? "draft",
    categoryIds: product?.categoryIds ?? [],
    badges: product?.badges.join(", ") ?? "",
    materials: product?.materials.join(", ") ?? "",
    specifications: product?.specifications ?? [],
    isFeatured: product?.isFeatured ?? false,
    isBestseller: product?.isBestseller ?? false,
    isNewArrival: product?.isNewArrival ?? false,
    isCustomizable: product?.isCustomizable ?? false,
    images: product?.images ?? [],
    seoTitle: product?.seoTitle ?? "",
    seoDescription: product?.seoDescription ?? "",
  });

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    set("name", value);
    if (!product) set("slug", slugify(value));
  }

  function addSpec() {
    set("specifications", [...form.specifications, { label: "", value: "" }]);
  }

  function updateSpec(i: number, field: "label" | "value", value: string) {
    const specs = form.specifications.map((s, idx) =>
      idx === i ? { ...s, [field]: value } : s
    );
    set("specifications", specs);
  }

  function removeSpec(i: number) {
    set("specifications", form.specifications.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          slug: form.slug,
          sku: form.sku,
          barcode: form.barcode || undefined,
          description: form.description,
          shortDescription: form.shortDescription || undefined,
          price: parseFloat(form.price) || 0,
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
          costPrice: parseFloat(form.costPrice) || 0,
          stock: parseInt(form.stock) || 0,
          minStockLevel: parseInt(form.minStockLevel) || 5,
          status: form.status,
          categoryIds: form.categoryIds,
          badges: form.badges.split(",").map((b) => b.trim()).filter(Boolean),
          materials: form.materials.split(",").map((m) => m.trim()).filter(Boolean),
          specifications: form.specifications.filter((s) => s.label && s.value),
          isFeatured: form.isFeatured,
          isBestseller: form.isBestseller,
          isNewArrival: form.isNewArrival,
          isCustomizable: form.isCustomizable,
          images: form.images,
          seoTitle: form.seoTitle || undefined,
          seoDescription: form.seoDescription || undefined,
        };

        const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
        const method = product ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Save failed");

        toast.success(product ? "Product updated" : "Product created");
        if (!product) {
          router.push(`/admin/products/${result.id}`);
        } else {
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  async function handleDelete() {
    if (!product || !confirm("Archive this product? It will be hidden from the store.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Product archived");
      router.push("/admin/products");
    } catch {
      toast.error("Failed to archive product");
      setIsDeleting(false);
    }
  }

  const inputCls = "w-full border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#171717]/50 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main column */}
      <div className="space-y-6">
        {/* Basic info */}
        <Section title="Basic Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Name *</label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Damascus Chef's Knife"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input
                className={inputCls}
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="damascus-chefs-knife"
              />
            </div>
            <div>
              <label className={labelCls}>SKU *</label>
              <input
                className={`${inputCls} font-mono`}
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="FLT-001"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Barcode</label>
              <input
                className={`${inputCls} font-mono`}
                value={form.barcode}
                onChange={(e) => set("barcode", e.target.value)}
                placeholder="1234567890123"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelCls}>Short Description</label>
            <input
              className={inputCls}
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One line teaser shown in product cards"
            />
          </div>
          <div className="mt-4">
            <label className={labelCls}>Description *</label>
            <textarea
              className={`${inputCls} min-h-32 resize-y`}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Full product description…"
              required
            />
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Pricing">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Compare-at Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={form.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelCls}>Cost Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={form.costPrice}
                onChange={(e) => set("costPrice", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </Section>

        {/* Inventory */}
        <Section title="Inventory">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Stock Quantity</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Min Stock Level (alert threshold)</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={form.minStockLevel}
                onChange={(e) => set("minStockLevel", e.target.value)}
              />
            </div>
          </div>
        </Section>

        {/* Images */}
        <Section title="Product Photos">
          <p className="mb-4 text-sm text-[#171717]/55">
            Upload real product photos (JPEG / PNG / WebP). Avoid SVG placeholders for catalogue
            items — photography sells craftsmanship.
          </p>
          <ProductImageUploader
            images={form.images}
            onChange={(images) => set("images", images)}
          />
        </Section>

        {/* Specifications */}
        <Section title="Specifications">
          <div className="space-y-2">
            {form.specifications.map((spec, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="Label (e.g. Blade Length)"
                  value={spec.label}
                  onChange={(e) => updateSpec(i, "label", e.target.value)}
                />
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="Value (e.g. 8 inches)"
                  value={spec.value}
                  onChange={(e) => updateSpec(i, "value", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  className="shrink-0 px-2 text-[#171717]/30 hover:text-red-500 transition-colors text-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSpec}
            className="mt-3 text-xs text-copper/70 hover:text-copper transition-colors"
          >
            + Add Specification
          </button>
        </Section>

        {/* SEO */}
        <Section title="SEO">
          <div className="space-y-3">
            <div>
              <label className={labelCls}>SEO Title</label>
              <input className={inputCls} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>SEO Description</label>
              <textarea className={`${inputCls} h-24 resize-y`} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
            </div>
          </div>
        </Section>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Status & Save */}
        <Section title="Status">
          <select
            className={inputCls}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="archived">Archived</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 w-full border border-[#171717] bg-[#171717] py-2.5 text-sm text-ivory hover:bg-[#171717]/90 transition-colors disabled:opacity-60"
          >
            {isPending ? "Saving…" : product ? "Save Changes" : "Create Product"}
          </button>
          {product && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="mt-2 w-full border border-red-200 py-2 text-sm text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {isDeleting ? "Archiving…" : "Archive Product"}
            </button>
          )}
        </Section>

        {/* Categories */}
        <Section title="Categories">
          <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[#171717]/10 p-3">
            {categories.length === 0 && (
              <p className="text-xs text-[#171717]/30">No categories yet.</p>
            )}
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-copper"
                  checked={form.categoryIds.includes(cat.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      set("categoryIds", [...form.categoryIds, cat.id]);
                    } else {
                      set("categoryIds", form.categoryIds.filter((id) => id !== cat.id));
                    }
                  }}
                />
                <span className="text-sm text-[#171717]">{cat.name}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Attributes */}
        <Section title="Attributes">
          <div className="space-y-2">
            {(["isFeatured", "isBestseller", "isNewArrival", "isCustomizable"] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-copper"
                  checked={form[flag]}
                  onChange={(e) => set(flag, e.target.checked)}
                />
                <span className="text-sm text-[#171717] capitalize">
                  {flag.replace("is", "").replace(/([A-Z])/g, " $1").trim()}
                </span>
              </label>
            ))}
          </div>
        </Section>

        {/* Tags */}
        <Section title="Badges & Materials">
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Badges (comma-separated)</label>
              <input
                className={inputCls}
                value={form.badges}
                onChange={(e) => set("badges", e.target.value)}
                placeholder="handmade, limited, bestseller"
              />
            </div>
            <div>
              <label className={labelCls}>Materials (comma-separated)</label>
              <input
                className={inputCls}
                value={form.materials}
                onChange={(e) => set("materials", e.target.value)}
                placeholder="Damascus steel, walnut"
              />
            </div>
          </div>
        </Section>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#171717]/10 bg-white p-5">
      <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-[#171717]/40">{title}</h3>
      {children}
    </div>
  );
}
