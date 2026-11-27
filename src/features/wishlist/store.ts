"use client";

import { create } from "zustand";

type WishlistState = {
  productIds: string[];
  hydrated: boolean;
  hydrating: boolean;
};

type WishlistActions = {
  has: (productId: string) => boolean;
  setIds: (ids: string[]) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  hydrate: () => Promise<void>;
};

export const useWishlistStore = create<WishlistState & WishlistActions>((set, get) => ({
  productIds: [],
  hydrated: false,
  hydrating: false,

  has: (productId) => get().productIds.includes(productId),

  setIds: (ids) => set({ productIds: [...new Set(ids)], hydrated: true, hydrating: false }),

  add: (productId) =>
    set((state) => ({
      productIds: state.productIds.includes(productId)
        ? state.productIds
        : [...state.productIds, productId],
    })),

  remove: (productId) =>
    set((state) => ({
      productIds: state.productIds.filter((id) => id !== productId),
    })),

  hydrate: async () => {
    if (get().hydrated || get().hydrating) return;
    set({ hydrating: true });
    try {
      const res = await fetch("/api/wishlist");
      if (!res.ok) {
        set({ productIds: [], hydrated: true, hydrating: false });
        return;
      }
      const data = (await res.json()) as {
        items?: Array<{ id: string }>;
        productIds?: string[];
      };
      const ids =
        data.productIds ??
        data.items?.map((item) => item.id) ??
        [];
      set({ productIds: [...new Set(ids)], hydrated: true, hydrating: false });
    } catch {
      set({ productIds: [], hydrated: true, hydrating: false });
    }
  },
}));
