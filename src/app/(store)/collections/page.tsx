export const instant = false;

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCollections } from "@/features/products/queries";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated FLINT collections — kitchen steel, trail blades, and atelier essentials.",
};

export default async function CollectionsPage() {
  const collections = await getCollections().catch(() => []);

  return (
    <div className="bg-[#f6f3ee]">
      <div className="border-b border-[#1B365D]/08 bg-[#1B365D] pt-24 md:pt-28">
        <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 md:pb-14 lg:px-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
            Curated lines
          </p>
          <div className="editorial-rule mb-5 mt-4" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="max-w-[14ch] font-heading text-[clamp(2.4rem,5vw,3.75rem)] leading-[1.02] text-ivory">
              Collections
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-ivory/50 md:pb-1">
              From kitchen steel to trail-ready blades — each line is forged with a clear purpose.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-10">
        {collections.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {collections.map((col, index) => {
              const cover =
                col.image?.url ||
                ["/images/products/tracker-hunter.jpg", "/images/products/skinner.jpg"][index % 2]!;

              return (
                <Link
                  key={col._id}
                  href={`/collections/${col.slug}`}
                  className="group flex flex-col overflow-hidden bg-white transition-colors hover:bg-[#fbfaf7]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#1a1612]">
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
                    <h2 className="mt-1.5 font-heading text-2xl text-[#1B365D]">{col.name}</h2>
                    {col.description && (
                      <p className="mt-2 text-sm leading-relaxed text-[#1B365D]/55">
                        {col.description}
                      </p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1B365D]/60 transition-colors group-hover:text-copper">
                      Explore
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="font-heading text-2xl text-[#1B365D]">Collections coming soon.</p>
            <Link
              href="/catalogue"
              className="mt-6 inline-flex cursor-pointer text-[11px] font-medium uppercase tracking-[0.16em] text-copper"
            >
              Browse the catalogue →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
