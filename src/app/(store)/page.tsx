export const instant = false;

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHomeContent } from "@/features/cms/queries";
import {
  getBestsellers,
  getNewArrivals,
  getCollections,
} from "@/features/products/queries";
import { ProductCard } from "@/components/store/product-card";
import { NewsletterFormClient } from "@/components/store/newsletter-form";
import { HeroVideo } from "@/components/store/hero-video";
import { TestimonialSlider } from "@/components/store/testimonial-slider";
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
    image: "/images/products/damascus-blade.jpg",
    alt: "Damascus steel chosen for forging",
    tone: "dark" as const,
  },
  {
    num: "02",
    title: "Forging",
    desc: "Each blade is shaped at the forge, where heat and hammer turn raw steel into precision.",
    image: "/images/products/axe-1.jpg",
    alt: "Blade shaped under heat and hammer",
    tone: "dark" as const,
  },
  {
    num: "03",
    title: "Finishing",
    desc: "Hand-ground bevels, hand-fitted handles, and a final inspection before it reaches you.",
    image: "/images/products/folding-blue.jpg",
    alt: "Finished blade with fitted handle and sheath",
    tone: "light" as const,
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
    "Hand-forged knives and axes — ready to own, or built to your brief.";
  const heroCtaHref = heroBanner?.ctaHref || "/catalogue";
  const heroCtaLabel = heroBanner?.ctaLabel || "Shop the blades";

  return (
    <div className="bg-background">
      {/* ── Hero — brand, one headline, one line, CTAs, full-bleed forge ───── */}
      <section className="relative flex min-h-[100dvh] items-end overflow-hidden bg-ink">
        <HeroVideo
          src="/videos/hero-blades.mp4"
          poster="/images/products/damascus-blade.jpg"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[18%] left-[8%] h-40 w-40 rounded-full bg-copper/30 blur-3xl motion-safe:animate-[hero-ember_3.2s_ease-in-out_infinite]"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-end px-5 pb-20 pt-28 sm:px-6 sm:pb-24 lg:px-10 lg:pb-28">
          <div className="max-w-2xl">
            <p className="fade-up font-heading text-[clamp(4rem,14vw,8.5rem)] leading-[0.82] tracking-[-0.04em] text-copper drop-shadow-[0_0_40px_rgba(255,107,0,0.35)]">
              FLINT
            </p>

            <h1 className="fade-up mt-6 max-w-[16ch] font-heading text-[clamp(2rem,5vw,3.6rem)] leading-[1.05] text-white [animation-delay:120ms]">
              {heroTitle || (
                <>
                  Steel with fire in it —{" "}
                  <em className="not-italic text-copper">made to be used</em>
                </>
              )}
            </h1>

            <p className="fade-up mt-5 max-w-lg text-[15px] leading-relaxed text-white/75 [animation-delay:220ms] sm:text-base">
              {heroSubtitle}
            </p>

            <div className="fade-up mt-10 flex flex-wrap items-center gap-3.5 [animation-delay:320ms]">
              <Link href={heroCtaHref} className="hero-cta">
                {heroCtaLabel}
                <ArrowRight className="relative z-10 h-4 w-4" />
              </Link>
              <Link
                href="/custom"
                className="inline-flex min-h-12 items-center gap-3 border border-copper/55 bg-ink/35 px-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm transition-colors hover:border-copper hover:bg-copper/15"
              >
                Design yours
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* Trust strip — continues navy, no light fade under hero */}
      <section className="border-y border-white/10 bg-ink">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
          {[
            { value: "10+", label: "Years of craft" },
            { value: "1,200+", label: "Blades forged" },
            { value: "Hand-forged", label: "Every piece" },
            { value: "Lifetime", label: "Guarantee" },
          ].map((stat) => (
            <div key={stat.label} className="bg-ink px-5 py-7 sm:px-8 sm:py-8">
              <p className="font-heading text-2xl text-copper sm:text-3xl">{stat.value}</p>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-white/50">
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
              <h2 className="font-heading text-[clamp(2.15rem,4.2vw,3.5rem)] leading-[1.05] text-[#1B365D]">
                {introSection?.title ?? "An atelier for blades"}
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#1B365D]/60 sm:text-base">
                {introSection?.body ??
                  "Every FLINT piece begins as raw steel and ends as a tool with presence — balanced, finished by hand, and made to be used for decades."}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={introSection?.ctaHref ?? "/craft"}
                  className="inline-flex min-h-11 items-center gap-2 bg-[#1B365D] px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-[#243F6B]"
                >
                  {introSection?.ctaLabel ?? "Discover our process"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/catalogue"
                  className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper transition-colors hover:text-[#ff8533]"
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
                    <dt className="text-[10px] uppercase tracking-[0.16em] text-[#1B365D]/40">{row.term}</dt>
                    <dd className="mt-1 text-sm text-[#1B365D]">{row.detail}</dd>
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
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#1B365D]/35">
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
                <h2 className="font-heading text-3xl text-[#1B365D] md:text-4xl">Collections</h2>
                <p className="mt-2 max-w-md text-sm text-[#1B365D]/55">
                  Curated lines from kitchen steel to trail-ready blades.
                </p>
              </div>
              <Link
                href="/collections"
                className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-[#1B365D]/50 transition-colors hover:text-copper sm:inline-flex sm:items-center sm:gap-2"
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
                    className="group flex flex-col overflow-hidden bg-ivory transition-colors hover:bg-white"
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
                      <h3 className="mt-1.5 font-heading text-2xl text-[#1B365D]">{col.name}</h3>
                      {col.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-[#1B365D]/55">
                          {col.description}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1B365D]/60 transition-colors group-hover:text-copper">
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
                className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1B365D]/50"
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
        <section className="bg-ivory py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <div className="editorial-rule mb-4" />
                <h2 className="font-heading text-3xl text-[#1B365D] md:text-4xl">Bestsellers</h2>
                <p className="mt-2 max-w-md text-sm text-[#1B365D]/55">
                  The blades our customers keep coming back for.
                </p>
              </div>
              <Link
                href="/catalogue?sort=bestselling"
                className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-[#1B365D]/50 transition-colors hover:text-copper sm:inline-flex sm:items-center sm:gap-2"
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
                className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1B365D]/50"
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
        <section className="relative overflow-hidden border-y border-[#1B365D]/06 bg-[#efeae2] py-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 12% 18%, rgba(255, 107, 0,0.08), transparent 42%), radial-gradient(circle at 88% 0%, rgba(27, 54, 93,0.04), transparent 36%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
                  Fresh from the forge
                </p>
                <div className="editorial-rule mb-4 mt-4" />
                <h2 className="font-heading text-3xl text-[#1B365D] md:text-4xl">New Arrivals</h2>
                <p className="mt-2 max-w-md text-sm text-[#1B365D]/55">
                  Newly finished blades — just released from the atelier.
                </p>
              </div>
              <Link
                href="/catalogue?sort=newest"
                className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-[#1B365D]/50 transition-colors hover:text-copper sm:inline-flex sm:items-center sm:gap-2"
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
                className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1B365D]/50"
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
                className="inline-flex min-h-12 cursor-pointer items-center gap-3 bg-copper px-7 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#ff8533]"
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
      <section className="relative overflow-hidden bg-ivory py-16 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 8% 12%, rgba(255, 107, 0,0.07), transparent 40%), radial-gradient(circle at 92% 88%, rgba(27, 54, 93,0.035), transparent 38%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
          <div className="mb-12 flex flex-col gap-5 md:mb-16 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
                Our process
              </p>
              <div className="editorial-rule mb-5 mt-4" />
              <h2 className="max-w-[16ch] font-heading text-[clamp(2.15rem,4.2vw,3.5rem)] leading-[1.05] text-[#1B365D]">
                {craftSection?.title ?? "Crafted with intention at every step."}
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#1B365D]/55 md:pb-1">
              {craftSection?.subtitle ??
                "From raw steel to finished blade — an unbroken chain of human skill."}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
            {CRAFT_STEPS.map((step) => {
              const light = step.tone === "light";
              return (
                <article key={step.num} className="group flex flex-col">
                  <div
                    className={
                      light
                        ? "relative aspect-[5/4] overflow-hidden bg-[#efeae2]"
                        : "relative aspect-[5/4] overflow-hidden bg-[#1a1612]"
                    }
                  >
                    <Image
                      src={step.image}
                      alt={step.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      quality={92}
                      className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div
                      className={
                        light
                          ? "absolute inset-0 bg-gradient-to-t from-[#efeae2]/35 to-transparent"
                          : "absolute inset-0 bg-gradient-to-t from-[#120e0b]/35 to-transparent"
                      }
                    />
                    <span
                      className={
                        light
                          ? "absolute left-4 top-4 font-heading text-2xl text-[#1B365D]/55"
                          : "absolute left-4 top-4 font-heading text-2xl text-ivory/90"
                      }
                    >
                      {step.num}
                    </span>
                  </div>
                  <div className="mt-5 border-t border-[#1B365D]/10 pt-5">
                    <h3 className="font-heading text-xl text-[#1B365D]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#1B365D]/55">{step.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center md:mt-14">
            <Link
              href="/craft"
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-[#1B365D]/15 bg-transparent px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-[#1B365D] transition-colors hover:border-copper hover:text-copper"
            >
              See how we work
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      {cms.testimonials.length > 0 && (
        <section className="relative overflow-hidden border-y border-[#1B365D]/06 bg-[#efeae2] py-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "radial-gradient(circle at 12% 18%, rgba(255, 107, 0,0.08), transparent 40%), radial-gradient(circle at 90% 85%, rgba(27, 54, 93,0.035), transparent 38%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
            <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
                  Voices from the field
                </p>
                <div className="editorial-rule mb-5 mt-4" />
                <h2 className="max-w-[16ch] font-heading text-[clamp(2.15rem,4.2vw,3.5rem)] leading-[1.05] text-[#1B365D]">
                  What our customers say.
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-[#1B365D]/55 md:pb-1">
                Chefs, collectors, and guides — the people who put FLINT steel to work.
              </p>
            </div>

            <TestimonialSlider testimonials={cms.testimonials} />
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
