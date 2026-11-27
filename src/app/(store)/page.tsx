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
import { HeroVideo } from "@/components/store/hero-video";
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
    getBestsellers(4).catch(() => []),
    getNewArrivals(4).catch(() => []),
    getCollections(true).catch(() => []),
  ]);

  const heroBanner = cms.banners.find((b) => b.placement === "home_hero");
  const introSection = cms.sections.find((s) => s.key === "brand_intro");
  const craftSection = cms.sections.find((s) => s.key === "craftsmanship");
  const customSection = cms.sections.find((s) => s.key === "custom_promo");

  const heroTitle = heroBanner?.title?.trim();
  const heroSubtitle =
    heroBanner?.subtitle?.trim() ||
    "Premium handmade knives and axes, crafted to order or ready from the atelier.";
  const heroCtaHref = heroBanner?.ctaHref || "/catalogue";
  const heroCtaLabel = heroBanner?.ctaLabel || "Explore the catalogue";

  return (
    <div className="bg-background">
      {/* ── Hero — brand, one headline, one line, CTAs, full-bleed forge ───── */}
      <section className="relative flex min-h-[100dvh] items-end overflow-hidden bg-ink">
        <HeroVideo poster="/images/products/tracker-hunter.jpg" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-end px-5 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-10 lg:pb-24">
          <div className="max-w-xl">
            <p className="fade-up font-heading text-[clamp(3.5rem,12vw,7.5rem)] leading-[0.88] tracking-[-0.03em] text-copper">
              FLINT
            </p>

            <h1 className="fade-up mt-5 max-w-[14ch] font-heading text-[clamp(1.85rem,4.6vw,3.25rem)] leading-[1.08] text-ivory [animation-delay:120ms]">
              {heroTitle || (
                <>
                  Forged for the hand that knows
                </>
              )}
            </h1>

            <p className="fade-up mt-5 max-w-md text-[15px] leading-relaxed text-ivory/65 [animation-delay:220ms] sm:text-base">
              {heroSubtitle}
            </p>

            <div className="fade-up mt-9 flex flex-wrap items-center gap-3 [animation-delay:320ms]">
              <Link
                href={heroCtaHref}
                className="inline-flex min-h-12 items-center gap-3 bg-copper px-7 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#a86645]"
              >
                {heroCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/custom"
                className="inline-flex min-h-12 items-center gap-3 border border-ivory/25 px-7 text-[11px] font-medium uppercase tracking-[0.18em] text-ivory/85 transition-colors hover:border-ivory/50 hover:text-ivory"
              >
                Custom order
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Trust strip sits below the first viewport */}
      <section className="border-b border-[#171717]/08 bg-[#f6f3ee]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-[#171717]/08 sm:grid-cols-4">
          {[
            { value: "10+", label: "Years of craft" },
            { value: "1,200+", label: "Blades forged" },
            { value: "Hand-forged", label: "Every piece" },
            { value: "Lifetime", label: "Guarantee" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#f6f3ee] px-5 py-7 sm:px-8 sm:py-8">
              <p className="font-heading text-2xl text-[#171717] sm:text-3xl">{stat.value}</p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-[#171717]/45">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Brand Intro ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
                The atelier
              </p>
              <div className="editorial-rule mb-6 mt-4" />
              <h2 className="font-heading text-[clamp(2.15rem,4.2vw,3.5rem)] leading-[1.05] text-[#171717]">
                {introSection?.title ?? "An atelier for blades"}
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#171717]/60 sm:text-base">
                {introSection?.body ??
                  "Every FLINT piece begins as raw steel and ends as a tool with presence — balanced, finished by hand, and made to be used for decades."}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={introSection?.ctaHref ?? "/craft"}
                  className="inline-flex min-h-11 items-center gap-2 bg-[#171717] px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-[#2a2a2a]"
                >
                  {introSection?.ctaLabel ?? "Discover our process"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/catalogue"
                  className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper transition-colors hover:text-[#a86645]"
                >
                  Shop blades →
                </Link>
              </div>

              <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-5">
                {[
                  { term: "Steel", detail: "High-carbon & Damascus" },
                  { term: "Finish", detail: "Hand-ground bevels" },
                  { term: "Handles", detail: "Stabilized hardwoods" },
                  { term: "Promise", detail: "Lifetime craftsmanship" },
                ].map((row) => (
                  <div key={row.term}>
                    <dt className="text-[10px] uppercase tracking-[0.16em] text-[#171717]/40">{row.term}</dt>
                    <dd className="mt-1 text-sm text-[#171717]">{row.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Product sits on page bg — blend removes the photo's white studio backdrop */}
            <div className="flex flex-col items-center lg:items-end">
              <Image
                src="/images/products/chef-bone-handle.jpg"
                alt="Damascus chef knife with bone handle and leather sheath"
                width={794}
                height={794}
                quality={95}
                sizes="(max-width: 1024px) 90vw, 42vw"
                className="h-auto w-full max-w-lg mix-blend-multiply object-contain"
                priority={false}
              />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#171717]/35">
                Signature Damascus · handmade
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Collections ────────────────────────────────────────────────────── */}
      {collections.length > 0 && (
        <section className="bg-[#efeae2] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <div className="editorial-rule mb-4" />
                <h2 className="font-heading text-3xl text-[#171717] md:text-4xl">Collections</h2>
                <p className="mt-2 max-w-md text-sm text-[#171717]/55">
                  Curated lines from kitchen steel to trail-ready blades.
                </p>
              </div>
              <Link
                href="/collections"
                className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-[#171717]/50 transition-colors hover:text-copper sm:inline-flex sm:items-center sm:gap-2"
              >
                All collections
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div
              className={
                collections.length === 1
                  ? "grid grid-cols-1"
                  : "grid grid-cols-1 gap-5 md:grid-cols-2"
              }
            >
              {collections.slice(0, 2).map((col, index) => {
                const cover =
                  col.image?.url ||
                  ["/images/products/tracker-hunter.jpg", "/images/products/skinner.jpg"][index % 2]!;

                return (
                  <Link
                    key={col._id}
                    href={`/collections/${col.slug}`}
                    className="group flex flex-col overflow-hidden bg-[#f6f3ee] transition-colors hover:bg-white"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1612]">
                      <Image
                        src={cover}
                        alt={col.image?.alt ?? col.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={92}
                        className="object-cover object-[center_40%] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>

                    <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
                      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-copper">
                        Collection
                      </p>
                      <h3 className="mt-1.5 font-heading text-2xl text-[#171717]">{col.name}</h3>
                      {col.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-[#171717]/55">
                          {col.description}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#171717]/60 transition-colors group-hover:text-copper">
                        Explore
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#171717]/50"
              >
                All collections
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured / Bestsellers ──────────────────────────────────────────── */}
      {bestsellers.length > 0 && (
        <section className="bg-[#f6f3ee] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <div className="editorial-rule mb-4" />
                <h2 className="font-heading text-3xl text-[#171717] md:text-4xl">Bestsellers</h2>
                <p className="mt-2 max-w-md text-sm text-[#171717]/55">
                  The blades our customers keep coming back for.
                </p>
              </div>
              <Link
                href="/catalogue?sort=bestselling"
                className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-[#171717]/50 transition-colors hover:text-copper sm:inline-flex sm:items-center sm:gap-2"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {bestsellers.slice(0, 4).map((p, i) => (
                <ProductCard key={p._id} product={p} priority={i < 2} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/catalogue?sort=bestselling"
                className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#171717]/50"
              >
                View all bestsellers
                <ArrowRight className="h-3.5 w-3.5" />
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
        <section className="relative overflow-hidden border-y border-[#171717]/06 bg-[#efeae2] py-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 12% 18%, rgba(184,115,79,0.08), transparent 42%), radial-gradient(circle at 88% 0%, rgba(23,23,23,0.04), transparent 36%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
                  Fresh from the forge
                </p>
                <div className="editorial-rule mb-4 mt-4" />
                <h2 className="font-heading text-3xl text-[#171717] md:text-4xl">New Arrivals</h2>
                <p className="mt-2 max-w-md text-sm text-[#171717]/55">
                  Newly finished blades — just released from the atelier.
                </p>
              </div>
              <Link
                href="/catalogue?sort=newest"
                className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-[#171717]/50 transition-colors hover:text-copper sm:inline-flex sm:items-center sm:gap-2"
              >
                See all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {newArrivals.slice(0, 4).map((p, i) => (
                <ProductCard key={p._id} product={p} priority={i < 2} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/catalogue?sort=newest"
                className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#171717]/50"
              >
                See all new arrivals
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Custom Design Promo ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#120e0b]">
        <div className="absolute inset-0">
          <Image
            src="/images/products/damascus-blade.jpg"
            alt=""
            fill
            sizes="100vw"
            quality={85}
            className="object-cover object-center opacity-[0.18]"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#120e0b] via-[#120e0b]/90 to-[#120e0b]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120e0b] via-transparent to-[#120e0b]/45" />
          <div
            aria-hidden
            className="absolute -right-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-copper/[0.12] blur-[110px]"
          />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-32">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
              Bespoke commission
            </p>
            <div className="editorial-rule mb-6 mt-4" />
            <h2 className="max-w-[14ch] font-heading text-[clamp(2.4rem,5vw,4.25rem)] leading-[1.02] text-ivory">
              {customSection?.title ?? (
                <>
                  Your blade,
                  <br />
                  <span className="text-copper">your story.</span>
                </>
              )}
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ivory/60 sm:text-base">
              {customSection?.body ??
                "Choose profile, steel, handle, and finish. Upload references. Receive a personal quotation from the forge."}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={customSection?.ctaHref ?? "/custom"}
                className="inline-flex min-h-12 cursor-pointer items-center gap-3 bg-copper px-7 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#a86645]"
              >
                {customSection?.ctaLabel ?? "Start custom design"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/craft"
                className="text-[11px] font-medium uppercase tracking-[0.16em] text-ivory/55 transition-colors hover:text-ivory"
              >
                How we forge →
              </Link>
            </div>

            <ol className="mt-12 grid gap-4 sm:grid-cols-2">
              {[
                { step: "01", label: "Steel of your choice" },
                { step: "02", label: "Handle material & finish" },
                { step: "03", label: "Custom dimensions" },
                { step: "04", label: "Personal engraving" },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3 border-t border-white/[0.08] pt-4">
                  <span className="font-heading text-sm text-copper">{item.step}</span>
                  <span className="pt-0.5 text-sm text-ivory/70">{item.label}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#1a1410]">
              <Image
                src={customSection?.image?.url ?? "/images/products/chef-bone-handle.jpg"}
                alt="Hand-forged custom blade"
                fill
                sizes="(max-width: 1024px) 90vw, 42vw"
                quality={92}
                className="object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120e0b]/55 via-transparent to-transparent" />
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ivory/35">
              Built to your brief · quoted by the forge
            </p>
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
