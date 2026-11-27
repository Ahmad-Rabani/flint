export const instant = false;

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPageBySlug } from "@/features/cms/queries";

export const metadata: Metadata = {
  title: "About",
  description: "FLINT — an atelier for handmade knives and axes, forged with intention.",
};

export default async function AboutPage() {
  const page = await getPageBySlug("about").catch(() => null);

  return (
    <div className="bg-[#f6f3ee]">
      <div className="border-b border-[#1B365D]/08 bg-[#1B365D] pt-24 md:pt-28">
        <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 md:pb-14 lg:px-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
            The atelier
          </p>
          <div className="editorial-rule mb-5 mt-4" />
          <h1 className="max-w-[14ch] font-heading text-[clamp(2.4rem,5vw,3.75rem)] leading-[1.02] text-ivory">
            {page?.title ?? "About FLINT"}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory/55 md:text-base">
            {page?.seoDescription ??
              "We forge knives and axes for people who care how a tool feels in the hand — and how it lasts."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-10">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            {page?.content ? (
              <article
                className="prose prose-neutral max-w-none prose-headings:font-heading prose-a:text-copper"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            ) : (
              <div className="space-y-5 text-[15px] leading-relaxed text-[#1B365D]/65">
                <p>
                  FLINT began as a small forge practice and grew into an atelier for people who want
                  tools with presence — balanced, finished by hand, and made to be used for decades.
                </p>
                <p>
                  Every piece starts with honest steel. We select high-carbon and Damascus stock,
                  forge each profile with intention, then grind, fit, and finish by hand before it
                  leaves the workshop.
                </p>
                <p>
                  Alongside ready pieces, we take custom commissions — steel, handle, dimensions,
                  and engraving — quoted personally before any payment.
                </p>
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/craft"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 bg-[#1B365D] px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-[#243F6B]"
              >
                See our process
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/custom"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-[#1B365D]/15 px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-[#1B365D] transition-colors hover:border-copper hover:text-copper"
              >
                Commission a blade
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden bg-[#1a1612]">
            <Image
              src="/images/products/chef-bone-handle.jpg"
              alt="FLINT handmade knife"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              quality={92}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
