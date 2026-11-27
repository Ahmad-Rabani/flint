import Image from "next/image";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import type { PlainProduct } from "@/features/products/queries";
import { ProductWishlistButton } from "@/components/store/product-wishlist-button";
import { ProductCardCartButton } from "@/components/store/product-card-cart-button";

type Props = {
  product: PlainProduct;
  priority?: boolean;
  className?: string;
};

const BADGE_STYLES: Record<string, string> = {
  New: "bg-copper text-white",
  Bestseller: "bg-[#171717] text-ivory",
  Limited: "bg-[#2a1a10] text-copper",
  Custom: "bg-[#1a2214] text-[#7cad60]",
  Outdoor: "bg-[#171717] text-ivory",
  Featured: "bg-copper text-white",
};

function isStudioWhiteBg(url: string) {
  return /chef-bone-handle|fish-folder/i.test(url);
}

export function ProductCard({ product, priority = false, className }: Props) {
  const primaryImage = product.images[0];
  const hoverImage = product.images[1];
  const isOnSale =
    product.compareAtPrice !== undefined && product.compareAtPrice > product.price;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;
  const studioShot = primaryImage ? isStudioWhiteBg(primaryImage.url) : false;

  const displayBadges = Array.from(
    new Set([
      ...(product.isNewArrival ? ["New"] : []),
      ...(product.isBestseller ? ["Bestseller"] : []),
      ...(product.badges ?? []),
    ]),
  ).slice(0, 2);

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link
        href={`/products/${product.slug}`}
        className={cn(
          "relative block aspect-[4/5] overflow-hidden transition-shadow duration-500",
          studioShot ? "bg-[#f3efe8]" : "bg-[#1a1612]",
        )}
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
              quality={90}
              className={cn(
                "transition-transform duration-700 ease-out group-hover:scale-[1.03]",
                studioShot
                  ? "object-contain object-center p-5 mix-blend-multiply sm:p-6"
                  : "object-cover object-center",
              )}
              priority={priority}
            />
            {hoverImage && !studioShot && (
              <Image
                src={hoverImage.url}
                alt={hoverImage.alt ?? product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                quality={90}
                className="absolute inset-0 object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                priority={false}
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Image
              src="/images/products/placeholder-knife.svg"
              alt={product.name}
              width={120}
              height={200}
              className="opacity-20"
            />
          </div>
        )}

        {displayBadges.length > 0 && (
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
            {displayBadges.map((badge, index) => (
              <span
                key={`${badge}-${index}`}
                className={cn(
                  "px-2 py-1 text-[9px] font-semibold uppercase tracking-widest leading-none",
                  BADGE_STYLES[badge] ?? "bg-[#171717] text-ivory",
                )}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#171717]/45 backdrop-blur-[1px]">
            <span className="border border-ivory/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-ivory/85">
              Sold out
            </span>
          </div>
        )}
      </Link>

      <ProductWishlistButton productId={product._id} productName={product.name} />

      <div className="mt-4 flex flex-1 flex-col px-0.5">
        {product.materials.length > 0 && (
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-[#171717]/40">
            {product.materials.slice(0, 2).join(" · ")}
          </p>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="block text-[15px] font-medium leading-snug text-[#171717] transition-colors hover:text-copper"
        >
          {product.name}
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={cn(
              "font-heading text-lg",
              isOnSale ? "text-copper" : "text-[#171717]",
            )}
          >
            {formatCurrency(product.price)}
          </span>
          {isOnSale && (
            <span className="text-xs text-[#171717]/40 line-through">
              {formatCurrency(product.compareAtPrice!)}
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="ml-auto text-[10px] text-copper">Only {product.stock} left</span>
          )}
        </div>

        {product.averageRating > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={cn(
                    "h-2.5 w-2.5",
                    i < Math.round(product.averageRating) ? "text-copper" : "text-[#171717]/15",
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-[#171717]/40">({product.reviewCount})</span>
          </div>
        )}

        <div className="mt-auto pt-4">
          <ProductCardCartButton
            productId={product._id}
            name={product.name}
            slug={product.slug}
            sku={product.sku}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            imageUrl={primaryImage?.url}
            stock={product.stock}
          />
        </div>
      </div>
    </article>
  );
}
