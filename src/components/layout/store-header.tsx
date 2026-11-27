"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store";
import { useWishlistStore } from "@/features/wishlist/store";
import { BrandLogo } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Shop", href: "/catalogue" },
  { label: "Collections", href: "/collections" },
  { label: "Custom Order", href: "/custom" },
  { label: "Our Craft", href: "/craft" },
  { label: "About", href: "/about" },
];

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function StoreHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const hydrateWishlist = useWishlistStore((s) => s.hydrate);
  const isHomePage = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    void hydrateWishlist();
  }, [hydrateWishlist]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const solid = scrolled || !isHomePage;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
        solid
          ? "border-b border-white/[0.08] bg-ink/92 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-ink/55 to-transparent",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-6 lg:h-[4.75rem] lg:px-10">
        <BrandLogo
          variant="wordmark"
          tone="orange"
          priority
          className="select-none"
          imgClassName="h-9 w-auto lg:h-10"
        />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-200",
                  active ? "text-copper" : "text-ivory/70 hover:text-ivory",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-copper transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-0.5">
          <Link
            href="/catalogue"
            aria-label="Search catalogue"
            className="grid h-10 w-10 place-items-center text-ivory/70 transition-colors hover:text-ivory"
          >
            <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.5} />
          </Link>

          <Link
            href="/account"
            aria-label="Account"
            className="hidden h-10 w-10 place-items-center text-ivory/70 transition-colors hover:text-ivory sm:grid"
          >
            <User className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.5} />
          </Link>

          <Link
            href="/account/wishlist"
            aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"}
            className={cn(
              "relative hidden h-10 w-10 place-items-center transition-colors sm:grid",
              wishlistCount > 0
                ? "text-[#E8B84A] hover:text-[#f0c85c]"
                : "text-ivory/70 hover:text-ivory",
            )}
          >
            <Heart
              className="h-[1.125rem] w-[1.125rem]"
              strokeWidth={1.5}
              fill={wishlistCount > 0 ? "currentColor" : "none"}
            />
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label={`Cart, ${itemCount} items`}
            className="relative grid h-10 w-10 place-items-center text-ivory/70 transition-colors hover:text-ivory"
          >
            <ShoppingBag className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center bg-copper px-1 text-[9px] font-bold leading-none text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="ml-0.5 grid h-10 w-10 place-items-center text-ivory/70 transition-colors hover:text-ivory md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100vw,20rem)] border-l border-white/[0.08] bg-ink p-0"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5">
                  <button type="button" onClick={() => setMobileOpen(false)} className="text-left">
                    <BrandLogo variant="wordmark" tone="orange" href={null} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="grid h-9 w-9 place-items-center text-ivory/50 transition-colors hover:text-ivory"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex flex-col gap-1 px-3 py-6" aria-label="Mobile">
                  {NAV_LINKS.map((link) => {
                    const active = isActivePath(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "px-3 py-3 text-sm font-medium uppercase tracking-[0.16em] transition-colors",
                          active ? "bg-white/[0.04] text-copper" : "text-ivory/70 hover:text-ivory",
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-auto space-y-1 border-t border-white/[0.08] px-3 py-5">
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 text-sm text-ivory/65 transition-colors hover:text-ivory"
                  >
                    <User className="h-4 w-4" strokeWidth={1.5} />
                    Account
                  </Link>
                  <Link
                    href="/account/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 text-sm transition-colors",
                      wishlistCount > 0
                        ? "text-[#E8B84A] hover:text-[#f0c85c]"
                        : "text-ivory/65 hover:text-ivory",
                    )}
                  >
                    <Heart
                      className="h-4 w-4"
                      strokeWidth={1.5}
                      fill={wishlistCount > 0 ? "currentColor" : "none"}
                    />
                    Wishlist
                    {wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                  </Link>
                  <Link
                    href="/catalogue"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 flex items-center justify-center bg-copper px-3 py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-copper/90"
                  >
                    Shop the catalogue
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
