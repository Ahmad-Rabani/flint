"use client";

import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/features/cart/store";
import { cn } from "@/lib/utils";
import type { PlainProduct } from "@/features/products/queries";

type Props = {
  product: PlainProduct;
  isOutOfStock: boolean;
};

export function ProductActions({ product, isOutOfStock }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<
    PlainProduct["variants"][number] | null
  >(product.variants.length > 0 ? product.variants[0] : null);
  const [wishlistAdded, setWishlistAdded] = useState(false);

  const addLine = useCartStore((s) => s.addLine);

  const activeVariants = product.variants.filter((v) => v.isActive);
  const displayPrice = selectedVariant?.price ?? product.price;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const maxQty = Math.max(1, displayStock);

  function handleAddToCart() {
    addLine({
      productId: product._id,
      variantId: selectedVariant?._id,
      name: product.name + (selectedVariant ? ` — ${selectedVariant.name}` : ""),
      slug: product.slug,
      image: product.images[0]?.url,
      price: displayPrice,
      compareAtPrice: selectedVariant?.compareAtPrice ?? product.compareAtPrice,
      quantity,
      sku: selectedVariant?.sku ?? product.sku,
    });
    toast.success(`Added to cart`, {
      description: product.name,
    });
  }

  async function handleWishlist() {
    const method = wishlistAdded ? "DELETE" : "POST";
    const res = await fetch("/api/wishlist", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product._id }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        toast.error("Sign in to save wishlist items");
        return;
      }
      toast.error("Could not update wishlist");
      return;
    }
    setWishlistAdded((v) => !v);
    toast.success(wishlistAdded ? "Removed from wishlist" : "Added to wishlist");
  }

  return (
    <div className="space-y-5 pt-1">
      {/* Variant selector */}
      {activeVariants.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
            Variant
          </p>
          <div className="flex flex-wrap gap-2">
            {activeVariants.map((v) => (
              <button
                key={v._id}
                onClick={() => setSelectedVariant(v)}
                disabled={v.stock === 0}
                className={cn(
                  "px-4 py-2 text-xs border transition-all",
                  selectedVariant?._id === v._id
                    ? "border-copper text-copper bg-copper/5"
                    : "border-border text-muted-foreground hover:border-foreground",
                  v.stock === 0 && "opacity-40 cursor-not-allowed",
                )}
              >
                {v.name}
                {v.stock === 0 && " (Sold out)"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
          Quantity
        </p>
        <div className="inline-flex items-center border border-border">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="p-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-5 py-3 text-sm tabular-nums min-w-[3rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty || isOutOfStock}
            className="p-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CTA row */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 flex items-center justify-center gap-3 bg-ink hover:bg-ink/80 text-ivory py-4 text-xs uppercase tracking-widest font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
        <button
          onClick={handleWishlist}
          aria-label={wishlistAdded ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "p-4 border transition-all",
            wishlistAdded
              ? "border-copper text-copper bg-copper/5"
              : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
          )}
        >
          <Heart
            className="w-4 h-4"
            strokeWidth={1.5}
            fill={wishlistAdded ? "currentColor" : "none"}
          />
        </button>
      </div>
    </div>
  );
}
