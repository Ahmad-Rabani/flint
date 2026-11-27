import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/features/products/queries";
import { ProductCard } from "@/components/store/product-card";
import { ProductActions } from "@/components/store/product-actions";
import { ProductThumbnails } from "@/components/store/product-thumbnails";
import { formatCurrency } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.shortDescription ?? product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? product.description.slice(0, 155),
      images: product.images[0] ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product._id, product.categoryIds, 4);

  const isOnSale =
    product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const displayBadges = [
    ...(product.isNewArrival ? ["New Arrival"] : []),
    ...(product.isBestseller ? ["Bestseller"] : []),
    ...(product.badges ?? []),
  ];

  return (
    <div className="pt-20 md:pt-24">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-5">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/catalogue" className="hover:text-foreground transition-colors">
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      {/* Main product section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pb-20">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
          {/* Gallery */}
          <ProductGallery images={product.images} name={product.name} />

          {/* Info panel */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            {/* Badges */}
            {displayBadges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayBadges.map((b) => (
                  <span
                    key={b}
                    className="text-[9px] uppercase tracking-widest font-semibold px-2.5 py-1 bg-copper/10 text-copper"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}

            {/* Name */}
            <div>
              <div className="editorial-rule mb-4" />
              <h1 className="font-heading text-3xl md:text-4xl xl:text-5xl leading-tight">
                {product.name}
              </h1>
              {product.materials.length > 0 && (
                <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {product.materials.join(" · ")}
                </p>
              )}
            </div>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.round(product.averageRating) ? "text-copper" : "text-border"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {product.averageRating.toFixed(1)} ({product.reviewCount}{" "}
                  {product.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-2xl md:text-3xl text-foreground">
                {formatCurrency(product.price)}
              </span>
              {isOnSale && (
                <>
                  <span className="text-muted-foreground line-through text-sm">
                    {formatCurrency(product.compareAtPrice!)}
                  </span>
                  <span className="text-xs text-copper font-medium">
                    Save{" "}
                    {Math.round(
                      ((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100,
                    )}
                    %
                  </span>
                </>
              )}
            </div>

            {/* Stock status */}
            {isOutOfStock ? (
              <p className="text-sm text-destructive">Out of stock — join the waitlist.</p>
            ) : isLowStock ? (
              <p className="text-sm text-copper">Only {product.stock} remaining.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                In stock · Ships within 3–5 business days
              </p>
            )}

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-5">
                {product.shortDescription}
              </p>
            )}

            {/* Add to cart + wishlist */}
            <ProductActions product={product} isOutOfStock={isOutOfStock} />

            {/* Specs */}
            {product.specifications.length > 0 && (
              <div className="border-t border-border pt-6">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-4">
                  Specifications
                </p>
                <dl className="space-y-2.5">
                  {product.specifications.map((spec) => (
                    <div key={spec.label} className="flex gap-4 text-sm">
                      <dt className="w-28 flex-shrink-0 text-muted-foreground">{spec.label}</dt>
                      <dd className="text-foreground">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Full description */}
            <div className="border-t border-border pt-6">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
                About This Piece
              </p>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                {product.description.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Custom CTA if applicable */}
            {product.isCustomizable && (
              <div className="border border-copper/20 bg-copper/5 p-5">
                <p className="text-sm font-medium text-copper mb-2">
                  This piece can be customised
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Request engraving, handle modifications, or unique finish options through our
                  custom order process.
                </p>
                <Link
                  href={`/custom?base=${product.slug}`}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-copper hover:text-copper/70 transition-colors"
                >
                  Request Customisation <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Trust badges */}
            <div className="border-t border-border pt-6 grid grid-cols-2 gap-3">
              {[
                { icon: "🔥", text: "Hand-forged in small batches" },
                { icon: "🛡", text: "Lifetime craftsmanship guarantee" },
                { icon: "📦", text: "Free shipping on orders over $200" },
                { icon: "↩", text: "30-day returns accepted" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs text-muted-foreground leading-snug">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="bg-muted/40 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-10">
              <div className="editorial-rule mb-4" />
              <h2 className="font-heading text-2xl md:text-3xl">You may also like</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
              {related.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Gallery sub-component ────────────────────────────────────────────────────
function ProductGallery({
  images,
  name,
}: {
  images: { key: string; url: string; alt?: string }[];
  name: string;
}) {
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted flex items-center justify-center">
        <Image
          src="/images/products/placeholder-knife.svg"
          alt={name}
          width={160}
          height={280}
          className="opacity-20"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square bg-muted overflow-hidden image-zoom">
        <Image
          src={images[0].url}
          alt={images[0].alt ?? name}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <ProductThumbnails images={images} name={name} />
      )}
    </div>
  );
}

