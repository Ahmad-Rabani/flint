"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  image?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  sku: string;
  customization?: Record<string, string>;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
};

type CartActions = {
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  removeLine: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  total: () => number;
  itemCount: () => number;
};

function lineKey(productId: string, variantId?: string) {
  return variantId ? `${productId}__${variantId}` : productId;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,

      addLine: (incoming) => {
        const key = lineKey(incoming.productId, incoming.variantId);
        set((state) => {
          const existing = state.lines.find(
            (l) => lineKey(l.productId, l.variantId) === key,
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                lineKey(l.productId, l.variantId) === key
                  ? { ...l, quantity: l.quantity + (incoming.quantity ?? 1) }
                  : l,
              ),
              isOpen: true,
            };
          }
          return {
            lines: [...state.lines, { ...incoming, quantity: incoming.quantity ?? 1 }],
            isOpen: true,
          };
        });
      },

      removeLine: (productId, variantId) => {
        const key = lineKey(productId, variantId);
        set((state) => ({
          lines: state.lines.filter((l) => lineKey(l.productId, l.variantId) !== key),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        const key = lineKey(productId, variantId);
        if (quantity <= 0) {
          set((state) => ({
            lines: state.lines.filter((l) => lineKey(l.productId, l.variantId) !== key),
          }));
          return;
        }
        set((state) => ({
          lines: state.lines.map((l) =>
            lineKey(l.productId, l.variantId) === key ? { ...l, quantity } : l,
          ),
        }));
      },

      clearCart: () => set({ lines: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      total: () => get().lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      itemCount: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
    }),
    {
      name: "flint-cart",
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);
