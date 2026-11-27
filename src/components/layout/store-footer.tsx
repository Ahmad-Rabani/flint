"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Mail } from "lucide-react";
import { BRAND } from "@/constants";
import { BrandLogo } from "@/components/brand/logo";

const SHOP_LINKS = [
  { label: "All Knives", href: "/catalogue?category=knives" },
  { label: "All Axes", href: "/catalogue?category=axes" },
  { label: "New Arrivals", href: "/catalogue?sort=newest" },
  { label: "Bestsellers", href: "/catalogue?sort=bestselling" },
  { label: "Collections", href: "/collections" },
];

const INFO_LINKS = [
  { label: "Our Craft", href: "/craft" },
  { label: "Custom Design", href: "/custom" },
  { label: "Care Guide", href: "/pages/care-guide" },
  { label: "Shipping & Returns", href: "/pages/shipping" },
  { label: "FAQ", href: "/pages/faq" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/pages/privacy" },
  { label: "Terms of Service", href: "/pages/terms" },
  { label: "Age Restriction Notice", href: "/pages/age-restriction" },
];

export function StoreFooter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("You're on the list.", { description: "We'll be in touch." });
      setEmail("");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="bg-ink text-ivory/70">
      {/* Custom CTA band */}
      <div className="border-y border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="editorial-rule mb-4" />
            <h2 className="font-heading text-2xl md:text-3xl text-ivory leading-tight">
              A blade forged for <em>you</em>.
            </h2>
            <p className="mt-2 text-sm text-ivory/50 max-w-sm">
              Every custom order is a conversation between craftsman and client. Tell us your vision.
            </p>
          </div>
          <Link
            href="/custom"
            className="inline-flex items-center gap-3 border border-copper/60 hover:border-copper text-copper hover:text-copper px-7 py-3 text-xs uppercase tracking-widest font-medium transition-all duration-300 hover:bg-copper/5 self-start md:self-auto"
          >
            Start Custom Order
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <BrandLogo variant="wordmark" tone="orange" />
          <p className="mt-4 text-sm leading-relaxed text-ivory/50 max-w-[220px]">
            {BRAND.tagline}. Hand-forged in small batches by master bladesmiths.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-ivory/40 hover:text-ivory transition-colors"
            >
              {/* Instagram icon */}
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="text-ivory/40 hover:text-ivory transition-colors"
            >
              {/* YouTube icon */}
              <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-ivory/30 mb-5">
            Shop
          </p>
          <ul className="space-y-3">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-ivory/60 hover:text-ivory transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-ivory/30 mb-5">
            Information
          </p>
          <ul className="space-y-3">
            {INFO_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-ivory/60 hover:text-ivory transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-ivory/30 mb-5">
            Newsletter
          </p>
          <p className="text-sm text-ivory/50 mb-5 leading-relaxed">
            New releases, forging stories, and limited drops — straight to your inbox.
          </p>
          <form onSubmit={handleNewsletter} className="flex gap-0">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-copper/60 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Subscribe"
              className="bg-copper hover:bg-copper/90 text-white px-4 py-2.5 transition-colors disabled:opacity-60"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <p className="mt-3 text-[11px] text-ivory/30">
            <Mail className="inline w-3 h-3 mr-1 -mt-px" />
            {BRAND.email}
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ivory/30">
            © 2026 FLINT. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-ivory/30 hover:text-ivory/60 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
