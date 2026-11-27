"use client";

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/features/cart/store";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  stock: number;
  className?: string;
};

export function ProductCardCartButton({
  productId,
  name,
  slug,
  sku,
  price,
  compareAtPrice,
  imageUrl,
  stock,
  className,
}: Props) {
  const addLine = useCartStore((s) => s.addLine);
  const outOfStock = stock <= 0;

  function handleAdd(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (outOfStock) return;

    addLine({
      productId,
      name,
      slug,
      image: imageUrl,
      price,
      compareAtPrice,
      sku,
      quantity: 1,
    });
    toast.success("Added to cart", { description: name });
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={outOfStock}
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center gap-2 px-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
        outOfStock
          ? "cursor-not-allowed bg-[#171717]/10 text-[#171717]/35"
          : "cursor-pointer bg-[#171717] text-ivory hover:bg-copper",
        className,
      )}
      aria-label={outOfStock ? `${name} is sold out` : `Add ${name} to cart`}
    >
      <ShoppingBag className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{outOfStock ? "Sold out" : "Add to cart"}</span>
    </button>
  );
}
