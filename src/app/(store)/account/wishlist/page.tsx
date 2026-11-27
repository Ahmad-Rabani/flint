"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/cart/store";
import { toast } from "sonner";

type WishlistItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  stock: number;
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const addLine = useCartStore((s) => s.addLine);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/wishlist");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(productId: string) {
    const res = await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.id !== productId));
      toast.success("Removed from wishlist");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading wishlist…</p>;
  }

  return (
    <div className="border border-border bg-white p-6">
      <h2 className="font-heading text-2xl text-ink">Wishlist</h2>
      {items.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">No saved pieces yet.</p>
          <Link
            href="/catalogue"
            className="mt-6 inline-flex h-11 items-center bg-ink px-5 text-xs uppercase tracking-[0.2em] text-ivory"
          >
            Explore catalogue
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-4 py-5">
              <Link href={`/products/${item.slug}`} className="relative h-20 w-20 bg-muted">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : null}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.slug}`} className="text-ink hover:text-copper">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="rounded-none bg-ink text-ivory"
                  disabled={item.stock <= 0}
                  onClick={() => {
                    addLine({
                      productId: item.id,
                      name: item.name,
                      slug: item.slug,
                      image: item.image,
                      price: item.price,
                      compareAtPrice: item.compareAtPrice,
                      sku: item.slug,
                    });
                    toast.success("Added to cart");
                  }}
                >
                  Add to cart
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  onClick={() => remove(item.id)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
