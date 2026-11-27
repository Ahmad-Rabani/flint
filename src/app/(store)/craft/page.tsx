export const instant = false;

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPageBySlug } from "@/features/cms/queries";

export const metadata: Metadata = {
  title: "Our Craft",
  description:
    "How FLINT blades are made — steel selection, forging, finishing, and the atelier process.",
};

const STEPS = [
  {
    num: "01",
    title: "Selection",
    body: "Only high-carbon and Damascus steels that meet our standards enter the forge.",
    image: "/images/products/damascus-blade.jpg",
  },
  {
    num: "02",
    title: "Forging",
    body: "Heat and hammer shape each blade profile with intention and balance.",
    image: "/images/products/axe-1.jpg",
  },
  {
    num: "03",
    title: "Finishing",
    body: "Hand-ground bevels, fitted handles, and a final inspection before it reaches you.",
    image: "/images/products/folding-blue.jpg",
  },
];

export default async function CraftPage() {
  const cmsPage = await getPageBySlug("craft").catch(() => null);
  const craftsmanship = await getPageBySlug("craftsmanship").catch(() => null);
  const page = cmsPage ?? craftsmanship;

  return (
    <div className="bg-[#f6f3ee]">
      <div className="border-b border-[#1B365D]/08 bg-[#1B365D] pt-24 md:pt-28">
        <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 md:pb-14 lg:px-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
            Process
          </p>
          <div className="editorial-rule mb-5 mt-4" />
          <h1 className="max-w-[14ch] font-heading text-[clamp(2.4rem,5vw,3.75rem)] leading-[1.02] text-ivory">
            {page?.title ?? "Our craft"}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory/55 md:text-base">
            {page?.seoDescription ??
              "From raw steel to finished blade — an unbroken chain of human skill in the FLINT atelier."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-10">
        {page?.content ? (
          <article
            className="prose prose-neutral max-w-3xl prose-headings:font-heading prose-a:text-copper"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        ) : (
          <div className="grid gap-10 md:grid-cols-3 md:gap-6">
            {STEPS.map((step) => (
              <article key={step.num} className="group">
                <div className="relative aspect-[5/4] overflow-hidden bg-[#1a1612]">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    quality={90}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-4 top-4 font-heading text-2xl text-ivory/90">
                    {step.num}
                  </span>
                </div>
                <h2 className="mt-5 font-heading text-xl text-[#1B365D]">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#1B365D]/55">{step.body}</p>
              </article>
            ))}
          </div>
        )}

        <div className="mt-14 flex flex-wrap gap-4 border-t border-[#1B365D]/08 pt-10">
          <Link
            href="/custom"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 bg-[#1B365D] px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-[#243F6B]"
          >
            Start a custom order
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/catalogue"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-[#1B365D]/15 px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-[#1B365D] transition-colors hover:border-copper hover:text-copper"
          >
            Shop ready pieces
          </Link>
        </div>
      </div>
    </div>
  );
}
