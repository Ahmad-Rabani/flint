"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { PlainCategory } from "@/features/products/queries";

type Props = {
  categories: PlainCategory[];
  currentParams: Record<string, string>;
  mobile?: boolean;
};

function FiltersContent({
  categories,
  currentParams,
  onApply,
}: {
  categories: PlainCategory[];
  currentParams: Record<string, string>;
  onApply?: () => void;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(currentParams.category ?? "");
  const [minPrice, setMinPrice] = useState(currentParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(currentParams.maxPrice ?? "");
  const [inStock, setInStock] = useState(currentParams.inStock === "true");

  function apply() {
    const sp = new URLSearchParams();
    if (currentParams.q) sp.set("q", currentParams.q);
    if (currentParams.sort) sp.set("sort", currentParams.sort);
    if (category) sp.set("category", category);
    if (minPrice) sp.set("minPrice", minPrice);
    if (maxPrice) sp.set("maxPrice", maxPrice);
    if (inStock) sp.set("inStock", "true");
    sp.set("page", "1");
    router.push(`/catalogue?${sp.toString()}`);
    onApply?.();
  }

  function clear() {
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    const sp = new URLSearchParams();
    if (currentParams.q) sp.set("q", currentParams.q);
    if (currentParams.sort) sp.set("sort", currentParams.sort);
    router.push(`/catalogue?${sp.toString()}`);
    onApply?.();
  }

  const hasFilters = !!(category || minPrice || maxPrice || inStock);

  return (
    <div className="space-y-8">
      {/* Category */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">
          Category
        </p>
        <div className="space-y-2">
          <button
            onClick={() => setCategory("")}
            className={`block text-sm transition-colors w-full text-left ${
              !category ? "text-copper font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setCategory(cat.slug)}
              className={`block text-sm transition-colors w-full text-left ${
                category === cat.slug
                  ? "text-copper font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">
          Price Range
        </p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min={0}
            className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-copper/60 transition-colors"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min={0}
            className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-copper/60 transition-colors"
          />
        </div>
      </div>

      {/* In stock */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="w-4 h-4 accent-[#FF6B00]"
          />
          <span className="text-sm text-muted-foreground">In stock only</span>
        </label>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={apply}
          className="w-full bg-ink text-ivory hover:bg-ink/80 transition-colors py-2.5 text-xs uppercase tracking-widest"
        >
          Apply Filters
        </button>
        {hasFilters && (
          <button
            onClick={clear}
            className="w-full border border-border text-muted-foreground hover:text-foreground transition-colors py-2.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

export function CatalogueFilters({ categories, currentParams, mobile = false }: Props) {
  const [open, setOpen] = useState(false);

  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <button className="flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors" />
          }
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </SheetTrigger>
        <SheetContent side="left" className="bg-background border-r border-border p-6 w-72">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-heading text-lg">Filters</SheetTitle>
          </SheetHeader>
          <FiltersContent
            categories={categories}
            currentParams={currentParams}
            onApply={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="sticky top-24">
      <p className="font-heading text-base mb-7">Filters</p>
      <FiltersContent categories={categories} currentParams={currentParams} />
    </div>
  );
}
