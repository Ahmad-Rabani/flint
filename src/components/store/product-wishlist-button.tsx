"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWishlistStore } from "@/features/wishlist/store";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  productName: string;
};

export function ProductWishlistButton({ productId, productName }: Props) {
  const [saving, setSaving] = useState(false);
  const hydrate = useWishlistStore((s) => s.hydrate);
  const has = useWishlistStore((s) => s.has);
  const add = useWishlistStore((s) => s.add);
  const remove = useWishlistStore((s) => s.remove);
  const wishlisted = has(productId);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    setSaving(true);

    const method = wishlisted ? "DELETE" : "POST";
    try {
      const res = await fetch("/api/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) {
        toast.error("Sign in to save wishlist items");
        return;
      }
      if (!res.ok) {
        toast.error("Could not update wishlist");
        return;
      }

      if (wishlisted) {
        remove(productId);
        toast.success("Removed from wishlist");
      } else {
        add(productId);
        toast.success(`Saved ${productName}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={
        wishlisted ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`
      }
      aria-pressed={wishlisted}
      disabled={saving}
      className={cn(
        "absolute right-3 top-3 z-10 grid h-9 w-9 cursor-pointer place-items-center bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-200",
        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
        wishlisted
          ? "text-[#E8B84A] opacity-100"
          : "text-[#1B365D]/70 hover:text-[#1B365D]",
      )}
      onClick={onClick}
    >
      <Heart
        className="h-3.5 w-3.5"
        strokeWidth={1.75}
        fill={wishlisted ? "currentColor" : "none"}
      />
    </button>
  );
}
