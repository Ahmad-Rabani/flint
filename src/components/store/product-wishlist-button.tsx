"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  productId: string;
  productName: string;
};

export function ProductWishlistButton({ productId, productName }: Props) {
  const [saving, setSaving] = useState(false);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
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
      toast.success(`Saved ${productName}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={`Add ${productName} to wishlist`}
      disabled={saving}
      className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white text-ink hover:text-copper"
      onClick={onClick}
    >
      <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
    </button>
  );
}
