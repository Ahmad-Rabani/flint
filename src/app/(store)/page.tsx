export const instant = false;

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import { getHomeContent } from "@/features/cms/queries";
import {
  getBestsellers,
  getNewArrivals,
  getCollections,
} from "@/features/products/queries";
import { ProductCard } from "@/components/store/product-card";
import { NewsletterFormClient } from "@/components/store/newsletter-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── Static fallback content ──────────────────────────────────────────────────
const CRAFT_STEPS = [
  {
    num: "01",
    title: "Selection",
    desc: "Only high-carbon and Damascus steels that meet our exacting standards begin the journey.",
  },
  {
    num: "02",
    title: "Forging",
    desc: "Each blade is shaped at the forge, where heat and hammer turn raw steel into precision.",
  },
  {
    num: "03",
    title: "Finishing",
    desc: "Hand-ground bevels, hand-fitted handles, and a final inspection before it reaches you.",
  },
];

// ─── Sections ─────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const [cms, bestsellers, newArrivals, collections] = await Promise.all([
    getHomeContent().catch(() => ({
      banners: [],
      sections: [],
      faqs: [],
      testimonials: [],
      navigation: undefined,
    })),
    getBestsellers(8).catch(() => []),
    getNewArrivals(4).catch(() => []),
    getCollections(true).catch(() => []),
  ]);

  const heroBanner = cms.banners.find((b) => b.placement === "home_hero");
  const introSection = cms.sections.find((s) => s.key === "brand_intro");
  const craftSection = cms.sections.find((s) => s.key === "craftsmanship");
  const customSection = cms.sections.find((s) => s.key === "custom_promo");

  return (
    <div className="bg-background">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-end bg-ink overflow-hidden">
        {/* Background image or gradient */}
        {heroBanner?.image ? (
          <Image
            src={heroBanner.image.url}
            alt={heroBanner.image.alt ?? "FLINT hero"}
            fill
            priority
            className="object-cover opacity-50"
          />
        ) : (
          <div className="absolute inset-0">
            <Image
              src="/images/hero-blade.svg"
              alt="Blade"
              fill
              priority
              className="object-contain object-right opacity-[0.07] scale-110"
            />
            {/* Warm gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink to-[#1f1008]" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-copper/[0.07] rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
          </div>
        )}

        {/* Copper vertical rule */}
        <div className="absolute left-10 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-copper/50 to-transparent hidden lg:block" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 pb-20 md:pb-28 w-full">
          <div className="max-w-2xl">
            <div className="editorial-rule mb-8" />
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl xl:text-8xl text-ivory leading-[0.95] fade-up">
              {heroBanner?.title ?? (
                <>
                  Forged in
                  <br />
                  <em className="text-copper not-italic">fire.</em>
                  <br />
                  Built to last.
                </>
              )}
            </h1>
            <p className="mt-7 text-base md:text-lg text-ivory/60 max-w-md leading-relaxed fade-up [animation-delay:0.15s]">
              {heroBanner?.subtitle ??
                "Every FLINT blade is hand-forged by master bladesmiths — precision tools crafted for a lifetime of use."}
            </p>
            <div className="mt-10 flex flex-wrap gap-4 fade-up [animation-delay:0.25s]">
              <Link
                href={heroBanner?.ctaHref ?? "/catalogue"}
                className="inline-flex items-center gap-3 bg-copper hover:bg-copper/90 text-white px-8 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors"
              >
                {heroBanner?.ctaLabel ?? "Shop the Collection"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/custom"
                className="inline-flex items-center gap-3 border border-ivory/20 hover:border-ivory/40 text-ivory/80 hover:text-ivory px-8 py-3.5 text-xs uppercase tracking-widest font-medium transition-all"
              >
                Custom Order
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 pt-8 border-t border-white/[0.06] flex flex-wrap gap-10 md:gap-20">
            {[
              { value: "10+", label: "Years of craft" },
              { value: "1,200+", label: "Blades forged" },
              { value: "Hand-forged", label: "Every piece" },
              { value: "Lifetime", label: "Guarantee" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-2xl text-ivory">{stat.value}</p>
                <p className="text-xs text-ivory/40 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Brand Intro ────────────────────────────────────────────────────── */}
      {(introSection || true) && (
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div>
                <div className="editorial-rule mb-6" />
                <h2 className="font-heading text-3xl md:text-4xl xl:text-5xl leading-tight">
                  {introSection?.title ?? "The art of the bladesmith."}
                </h2>
                <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                  {introSection?.body ??
                    "FLINT was born from a simple conviction: that a tool you use every day deserves to be extraordinary. We work with the finest high-carbon and Damascus steels, shaping each blade by hand through fire, hammer, and patience."}
                </p>
                <Link
                  href={introSection?.ctaHref ?? "/craft"}
                  className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-copper hover:text-copper/70 transition-colors"
                >
                  {introSection?.ctaLabel ?? "Discover our process"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {introSection?.image ? (
                  <Image
                    src={introSection.image.url}
                    alt={introSection.image.alt ?? "Craftsmanship"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full surface-grain flex items-center justify-center">
                    <Image
                      src="/images/products/placeholder-knife.svg"
                      alt="Blade"
                      width={180}
                      height={320}
                      className="opacity-30"
                    />
                  </div>
                )}
                {/* Copper corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-copper/40" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-copper/40" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Collections ────────────────────────────────────────────────────── */}
      {collections.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/40">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="editorial-rule mb-4" />
                <h2 className="font-heading text-3xl md:text-4xl">Collections</h2>
              </div>
              <Link
                href="/collections"
                className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-copper transition-colors"
              >
                All Collections
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.slice(0, 3).map((col, i) => (
                <Link
                  key={col._id}
                  href={`/collections/${col.slug}`}
                  className={`relative group overflow-hidden bg-ink aspect-[${i === 0 ? "4/3" : "3/4"}] block`}
                  style={{ aspectRatio: i === 0 ? "4/3" : "3/4" }}
                >
                  {col.image ? (
                    <Image
                      src={col.image.url}
                      alt={col.image.alt ?? col.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-70"
                    />
                  ) : (
                    <div className="absolute inset-0 surface-grain" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <p className="text-[10px] uppercase tracking-widest text-copper mb-2">
                      Collection
                    </p>
                    <h3 className="font-heading text-xl text-ivory">{col.name}</h3>
                    {col.description && (
                      <p className="mt-1.5 text-xs text-ivory/50 line-clamp-2 max-w-xs">
                        {col.description}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-ivory/60 group-hover:text-copper transition-colors">
                      Explore <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured / Bestsellers ──────────────────────────────────────────── */}
      {bestsellers.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="editorial-rule mb-4" />
                <h2 className="font-heading text-3xl md:text-4xl">Bestsellers</h2>
                <p className="mt-2 text-sm text-muted-foreground">The blades our customers keep coming back for.</p>
              </div>
              <Link
                href="/catalogue?sort=bestselling"
                className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-copper transition-colors"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
              {bestsellers.map((p, i) => (
                <ProductCard key={p._id} product={p} priority={i < 2} />
              ))}
            </div>
            <div className="mt-10 text-center sm:hidden">
              <Link
                href="/catalogue?sort=bestselling"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-copper transition-colors"
              >
                View All Bestsellers <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Empty state if no products ──────────────────────────────────────── */}
      {bestsellers.length === 0 && newArrivals.length === 0 && (
        <section className="py-28 text-center">
          <div className="mx-auto max-w-md px-6">
            <Image
              src="/images/products/placeholder-axe.svg"
              alt="Coming soon"
              width={80}
              height={120}
              className="mx-auto opacity-20 mb-6"
            />
            <h2 className="font-heading text-2xl mb-3">The forge is warming up.</h2>
            <p className="text-muted-foreground text-sm">
              Our collection is being curated. Check back soon for hand-forged blades.
            </p>
          </div>
        </section>
      )}

      {/* ── New Arrivals ────────────────────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="editorial-rule mb-4" />
                <h2 className="font-heading text-3xl md:text-4xl">New Arrivals</h2>
              </div>
              <Link
                href="/catalogue?sort=newest"
                className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-copper transition-colors"
              >
                See All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
              {newArrivals.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Custom Design Promo ─────────────────────────────────────────────── */}
      <section className="bg-ink relative overflow-hidden">
        <div className="absolute inset-0">
          {customSection?.image ? (
            <Image
              src={customSection.image.url}
              alt="Custom design"
              fill
              className="object-cover opacity-30"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a0e06] to-ink" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-copper/[0.08] rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
            </>
          )}
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
          <div className="max-w-xl">
            <div className="editorial-rule mb-6" />
            <h2 className="font-heading text-4xl md:text-5xl xl:text-6xl text-ivory leading-tight">
              {customSection?.title ?? (
                <>
                  Your blade,
                  <br />
                  <em className="text-copper not-italic">your story.</em>
                </>
              )}
            </h2>
            <p className="mt-5 text-base text-ivory/60 leading-relaxed max-w-sm">
              {customSection?.body ??
                "Commission a fully bespoke knife or axe — from steel selection and handle material to custom engraving. No two custom pieces are ever alike."}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href={customSection?.ctaHref ?? "/custom"}
                className="inline-flex items-center gap-3 bg-copper hover:bg-copper/90 text-white px-8 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors"
              >
                {customSection?.ctaLabel ?? "Start Your Custom Order"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-3">
              {[
                "Steel of your choice",
                "Handle material & finish",
                "Custom dimensions",
                "Personal engraving",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-sm text-ivory/50">
                  <span className="w-1 h-1 bg-copper rounded-none flex-shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Craftsmanship ───────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-14 md:mb-20 flex flex-col md:flex-row md:items-end gap-5 justify-between">
            <div>
              <div className="editorial-rule mb-4" />
              <h2 className="font-heading text-3xl md:text-4xl xl:text-5xl max-w-sm leading-tight">
                {craftSection?.title ?? "Crafted with intention at every step."}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {craftSection?.subtitle ??
                "From raw steel to finished blade — an unbroken chain of human skill."}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {CRAFT_STEPS.map((step) => (
              <div key={step.num} className="border-t border-border pt-8">
                <span className="font-heading text-5xl text-copper/20">{step.num}</span>
                <h3 className="font-heading text-xl mt-3">{step.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link
              href="/craft"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-copper transition-colors"
            >
              See how we work <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      {cms.testimonials.length > 0 && (
        <section className="py-20 md:py-28 bg-muted/40">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-12">
              <div className="editorial-rule mb-4" />
              <h2 className="font-heading text-3xl md:text-4xl">What our customers say.</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cms.testimonials.map((t) => (
                <div
                  key={t._id}
                  className="bg-background p-7 border border-border flex flex-col gap-4"
                >
                  <Quote className="w-5 h-5 text-copper/60" />
                  <p className="text-sm text-foreground leading-relaxed flex-1 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    {t.avatar ? (
                      <Image
                        src={t.avatar.url}
                        alt={t.authorName}
                        width={36}
                        height={36}
                        className="w-9 h-9 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-muted flex items-center justify-center text-xs font-heading text-muted-foreground">
                        {t.authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{t.authorName}</p>
                      {t.authorTitle && (
                        <p className="text-xs text-muted-foreground">{t.authorTitle}</p>
                      )}
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3 h-3 ${i < t.rating ? "text-copper" : "text-border"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      {cms.faqs.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 lg:px-10">
            <div className="mb-12 text-center">
              <div className="editorial-rule mx-auto mb-4" />
              <h2 className="font-heading text-3xl md:text-4xl">Frequently Asked Questions</h2>
            </div>
            <Accordion multiple={false} className="space-y-0">
              {cms.faqs.map((faq) => (
                <AccordionItem
                  key={faq._id}
                  value={faq._id}
                  className="border-b border-border"
                >
                  <AccordionTrigger className="text-sm font-medium text-left hover:text-copper py-5 hover:no-underline [&[data-state=open]]:text-copper">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* ── Newsletter ───────────────────────────────────────────────────────── */}
      <section className="bg-ink py-20 md:py-28">
        <div className="mx-auto max-w-xl px-6 text-center">
          <div className="editorial-rule mx-auto mb-6" />
          <h2 className="font-heading text-3xl md:text-4xl text-ivory">
            From the forge to your inbox.
          </h2>
          <p className="mt-4 text-sm text-ivory/50 leading-relaxed">
            Subscribe for new releases, behind-the-scenes stories, and exclusive early access.
          </p>
          <NewsletterFormClient />
        </div>
      </section>
    </div>
  );
}
