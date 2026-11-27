"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCartStore } from "@/features/cart/store";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer() {
  const { lines, isOpen, closeCart, removeLine, updateQuantity, total, itemCount } =
    useCartStore();

  const count = itemCount();
  const subtotal = total();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        className="bg-[#1a1a1a] border-l border-white/[0.07] p-0 w-full sm:w-96 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-white/[0.07]">
          <SheetTitle className="flex items-center gap-2 text-ivory font-heading text-lg tracking-wide">
            <ShoppingBag className="w-4.5 h-4.5 text-copper" strokeWidth={1.5} />
            Your Cart
            {count > 0 && (
              <span className="ml-auto text-xs text-ivory/40 font-sans font-normal">
                {count} {count === 1 ? "item" : "items"}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Lines */}
        <div className="flex-1 overflow-y-auto py-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4 py-16">
              <div className="w-14 h-14 rounded-sm border border-white/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-ivory/30" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-ivory/40">Your cart is empty.</p>
              <Link
                href="/catalogue"
                onClick={closeCart}
                className="text-xs uppercase tracking-widest text-copper hover:text-copper/80 transition-colors"
              >
                Explore the collection
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06] px-6">
              {lines.map((line) => (
                <li
                  key={`${line.productId}__${line.variantId ?? ""}`}
                  className="py-5 flex gap-4"
                >
                  {/* Image */}
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeCart}
                    className="flex-shrink-0 w-16 h-16 bg-white/5 overflow-hidden relative"
                  >
                    {line.image ? (
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-ivory/20" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={closeCart}
                      className="text-sm text-ivory hover:text-ivory/80 transition-colors line-clamp-2 leading-snug"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-xs text-ivory/40">{line.sku}</p>

                    {/* Customization */}
                    {line.customization && Object.keys(line.customization).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {Object.entries(line.customization).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] px-1.5 py-0.5 bg-white/5 text-ivory/50"
                          >
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Qty + price row */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-0 border border-white/10">
                        <button
                          onClick={() =>
                            updateQuantity(line.productId, line.quantity - 1, line.variantId)
                          }
                          className="p-1.5 text-ivory/50 hover:text-ivory transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-sm text-ivory tabular-nums min-w-[1.5rem] text-center">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(line.productId, line.quantity + 1, line.variantId)
                          }
                          className="p-1.5 text-ivory/50 hover:text-ivory transition-colors"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-ivory tabular-nums">
                          {formatCurrency(line.price * line.quantity)}
                        </span>
                        <button
                          onClick={() => removeLine(line.productId, line.variantId)}
                          className="text-ivory/30 hover:text-copper transition-colors"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="border-t border-white/[0.07] px-6 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ivory/60">Subtotal</span>
              <span className="text-base font-heading text-ivory tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <p className="text-xs text-ivory/30">Shipping & taxes calculated at checkout.</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex items-center justify-center gap-3 w-full bg-copper hover:bg-copper/90 text-white py-3.5 text-xs uppercase tracking-widest font-medium transition-colors"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-center text-xs text-ivory/30 hover:text-ivory/60 transition-colors py-1"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
