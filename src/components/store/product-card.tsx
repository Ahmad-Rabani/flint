import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { PlainProduct } from "@/features/products/queries";

type Props = {
  product: PlainProduct;
  priority?: boolean;
  className?: string;
};

const BADGE_STYLES: Record<string, string> = {
  "New": "bg-copper text-white",
  "Bestseller": "bg-ink text-ivory border border-ivory/20",
  "Limited": "bg-[#2a1a10] text-copper border border-copper/30",
  "Custom": "bg-[#1a2214] text-[#7cad60] border border-[#7cad60]/30",
};

export function ProductCard({ product, priority = false, className }: Props) {
  const primaryImage = product.images[0];
  const hoverImage = product.images[1];
  const isOnSale =
    product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  const displayBadges = [
    ...(product.isNewArrival ? ["New"] : []),
    ...(product.isBestseller ? ["Bestseller"] : []),
    ...(product.badges ?? []),
  ].slice(0, 2);

  return (
    <article className={cn("group relative flex flex-col hover-lift", className)}>
      {/* Image container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[3/4] bg-[#f0ece5] overflow-hidden"
        tabIndex={0}
        aria-label={product.name}
      >
        {primaryImage ? (
          <>
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-all duration-700 ease-out",
                hoverImage ? "group-hover:opacity-0" : "group-hover:scale-[1.04]",
              )}
              priority={priority}
            />
            {hoverImage && (
              <Image
                src={hoverImage.url}
                alt={hoverImage.alt ?? product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover absolute inset-0 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100 scale-[1.04]"
                priority={false}
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src="/images/products/placeholder-knife.svg"
              alt={product.name}
              width={120}
              height={200}
              className="opacity-20"
            />
          </div>
        )}

        {/* Badges */}
        {displayBadges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {displayBadges.map((badge) => (
              <span
                key={badge}
                className={cn(
                  "text-[9px] uppercase tracking-widest font-semibold px-2 py-1 leading-none",
                  BADGE_STYLES[badge] ?? "bg-ink text-ivory",
                )}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-ink/40 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[10px] uppercase tracking-widest text-ivory/80 border border-ivory/30 px-3 py-1.5">
              Sold Out
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          aria-label={`Add ${product.name} to wishlist`}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white text-ink hover:text-copper"
          onClick={(e) => {
            e.preventDefault();
            // wishlist handled on product page
          }}
        >
          <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </Link>

      {/* Info */}
      <div className="mt-3 px-0.5">
        {product.materials.length > 0 && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            {product.materials.slice(0, 2).join(" · ")}
          </p>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="block text-sm font-medium text-foreground hover:text-copper transition-colors leading-snug"
        >
          {product.name}
        </Link>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-heading text-foreground">
            {formatCurrency(product.price)}
          </span>
          {isOnSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.compareAtPrice!)}
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="text-[10px] text-copper ml-auto">Only {product.stock} left</span>
          )}
        </div>

        {product.averageRating > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5",
                    i < Math.round(product.averageRating) ? "text-copper" : "text-border",
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}
      </div>
    </article>
  );
}
