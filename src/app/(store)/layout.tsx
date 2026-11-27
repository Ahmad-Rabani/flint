import type { Metadata } from "next";
import { StoreHeader } from "@/components/layout/store-header";
import { StoreFooter } from "@/components/layout/store-footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/constants";

export const metadata: Metadata = {
  title: {
    template: `%s — ${BRAND.name}`,
    default: `${BRAND.name} — ${BRAND.tagline}`,
  },
  description:
    "Premium handmade knives and axes, hand-forged in small batches by master bladesmiths.",
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
  },
};

type Props = {
  children: React.ReactNode;
};

export default function StoreLayout({ children }: Props) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <CartDrawer />
      <Toaster position="bottom-right" richColors />
    </>
  );
}
