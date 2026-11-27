"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/features/cart/store";
import { BrandLogo } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Shop", href: "/catalogue" },
  { label: "Collections", href: "/collections" },
  { label: "Custom Order", href: "/custom" },
  { label: "Our Craft", href: "/craft" },
  { label: "About", href: "/about" },
];

export function StoreHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);

  const isHomePage = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerBase = cn(
    "fixed top-0 inset-x-0 z-50 transition-all duration-500",
    scrolled || !isHomePage
      ? "bg-ink/95 backdrop-blur-md border-b border-white/[0.06]"
      : "bg-transparent",
  );

  return (
    <header className={headerBase}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 flex items-center justify-between h-16 md:h-18">
        {/* Logo */}
        <BrandLogo variant="wordmark" tone="orange" priority className="select-none" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-xs uppercase tracking-widest font-medium transition-colors duration-200",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-copper"
                  : "text-ivory/70 hover:text-ivory",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/catalogue"
            aria-label="Search"
            className="p-2 text-ivory/70 hover:text-ivory transition-colors"
          >
            <Search className="w-4.5 h-4.5" strokeWidth={1.5} />
          </Link>

          <Link
            href="/account"
            aria-label="Account"
            className="p-2 text-ivory/70 hover:text-ivory transition-colors hidden sm:flex"
          >
            <User className="w-4.5 h-4.5" strokeWidth={1.5} />
          </Link>

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="p-2 text-ivory/70 hover:text-ivory transition-colors hidden sm:flex"
          >
            <Heart className="w-4.5 h-4.5" strokeWidth={1.5} />
          </Link>

          {/* Cart */}
          <button
            onClick={openCart}
            aria-label={`Cart (${itemCount} items)`}
            className="relative p-2 text-ivory/70 hover:text-ivory transition-colors"
          >
            <ShoppingBag className="w-4.5 h-4.5" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-sm bg-copper text-[9px] font-bold text-white flex items-center justify-center leading-none">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <button
                  className="ml-1 p-2 text-ivory/70 hover:text-ivory transition-colors md:hidden"
                  aria-label="Menu"
                />
              }
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-ink border-l border-white/[0.08] p-0 w-72"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
                  <span onClick={() => setMobileOpen(false)}>
                    <BrandLogo variant="wordmark" tone="orange" className="select-none" />
                  </span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1 text-ivory/50 hover:text-ivory"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex flex-col px-6 py-8 gap-6">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "text-sm uppercase tracking-widest font-medium transition-colors",
                        pathname === link.href ? "text-copper" : "text-ivory/70 hover:text-ivory",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto px-6 py-6 border-t border-white/[0.08] flex gap-4">
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm text-ivory/60 hover:text-ivory transition-colors"
                  >
                    <User className="w-4 h-4" strokeWidth={1.5} />
                    Account
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-sm text-ivory/60 hover:text-ivory transition-colors"
                  >
                    <Heart className="w-4 h-4" strokeWidth={1.5} />
                    Wishlist
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
