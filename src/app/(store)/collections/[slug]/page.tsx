export const instant = false;

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getCollectionBySlug,
  getProductsForCollection,
} from "@/features/products/queries";
import { ProductCard } from "@/components/store/product-card";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug).catch(() => null);
  if (!collection) return { title: "Collection" };
  return {
    title: collection.name,
    description: collection.description || `Explore the ${collection.name} collection from FLINT.`,
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug).catch(() => null);
  if (!collection) notFound();

  const products = await getProductsForCollection(
    collection._id,
    collection.productIds,
  ).catch(() => []);

  const cover = collection.image?.url || "/images/products/tracker-hunter.jpg";

  return (
    <div className="bg-[#f6f3ee]">
      <div className="relative overflow-hidden bg-[#1B365D] pt-24 md:pt-28">
        <div className="absolute inset-0">
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-center opacity-30"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B365D] via-[#1B365D]/88 to-[#1B365D]/55" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-12 sm:px-6 md:pb-16 lg:px-10">
          <Link
            href="/collections"
            className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ivory/55 transition-colors hover:text-ivory"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All collections
          </Link>
          <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
            Collection
          </p>
          <div className="editorial-rule mb-5 mt-4" />
          <h1 className="max-w-[16ch] font-heading text-[clamp(2.4rem,5vw,3.75rem)] leading-[1.02] text-ivory">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory/60 md:text-base">
              {collection.description}
            </p>
          )}
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-ivory/40">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-10">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard key={product._id} product={product} priority={index < 3} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="font-heading text-2xl text-[#1B365D]">No pieces in this collection yet.</p>
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
