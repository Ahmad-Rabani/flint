export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listProducts, getCategories } from "@/features/products/queries";
import { ProductCard } from "@/components/store/product-card";
import { CatalogueFilters } from "@/components/store/catalogue-filters";

export const metadata: Metadata = {
  title: "Catalogue",
  description:
    "Browse our full collection of hand-forged knives and axes. Filter by category, price, and more.",
};

type SearchParams = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  sort?: string;
  page?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "bestselling", label: "Bestselling" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name A–Z" },
];

export default async function CataloguePage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const sort =
    (params.sort as "newest" | "price_asc" | "price_desc" | "name" | "bestselling") ??
    "newest";

  const [result, categories] = await Promise.all([
    listProducts({
      q: params.q,
      category: params.category,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      inStock: params.inStock === "true" ? true : undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    getCategories(),
  ]);

  const { items, total, totalPages } = result;
  const activeCategory = params.category
    ? categories.find((c) => c.slug === params.category)
    : undefined;

  function pageHref(p: number) {
    const sp = new URLSearchParams(params as Record<string, string>);
    sp.set("page", String(p));
    return `/catalogue?${sp.toString()}`;
  }

  const title = params.q
    ? `Results for “${params.q}”`
    : (activeCategory?.name ?? "The Collection");

  return (
    <div className="bg-[#f6f3ee]">
      <div className="border-b border-[#171717]/08 bg-[#171717] pt-24 md:pt-28">
        <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 md:pb-14 lg:px-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
            Shop
          </p>
          <div className="editorial-rule mb-5 mt-4" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h1 className="max-w-[16ch] font-heading text-[clamp(2.4rem,5vw,3.75rem)] leading-[1.02] text-ivory">
              {title}
            </h1>
            <p className="text-sm text-ivory/50 md:pb-1">
              {total} {total === 1 ? "piece" : "pieces"} available
              {activeCategory?.description ? ` · ${activeCategory.description}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-14 lg:px-10">
        <div className="flex gap-8 lg:gap-12">
          <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
            <div className="sticky top-28">
              <CatalogueFilters
                categories={categories}
                currentParams={params as Record<string, string>}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-7 flex flex-wrap items-center gap-3 border-b border-[#171717]/08 pb-5">
              <div className="lg:hidden">
                <CatalogueFilters
                  categories={categories}
                  currentParams={params as Record<string, string>}
                  mobile
                />
              </div>

              <p className="hidden text-xs text-[#171717]/45 sm:block">
                Showing {items.length} of {total}
              </p>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#171717]/40">
                  Sort
                </span>
                {SORT_OPTIONS.map((opt) => (
                  <Link
                    key={opt.value}
                    href={`/catalogue?${new URLSearchParams({
                      ...(params as Record<string, string>),
                      sort: opt.value,
                      page: "1",
                    }).toString()}`}
                    className={
                      sort === opt.value
                        ? "cursor-pointer border border-copper bg-copper/5 px-3 py-1.5 text-xs text-copper"
                        : "cursor-pointer border border-[#171717]/12 px-3 py-1.5 text-xs text-[#171717]/55 transition-colors hover:border-[#171717]/35 hover:text-[#171717]"
                    }
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            {items.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-3">
                {items.map((p, i) => (
                  <ProductCard key={p._id} product={p} priority={i < 6} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <p className="font-heading text-2xl text-[#171717]">Nothing found.</p>
                <p className="mt-3 text-sm text-[#171717]/50">
                  Try adjusting your filters or search term.
                </p>
                <Link
                  href="/catalogue"
                  className="mt-6 inline-flex cursor-pointer text-[11px] font-medium uppercase tracking-[0.16em] text-copper transition-colors hover:text-[#a86645]"
                >
                  Clear all filters
                </Link>
              </div>
            )}

            {totalPages > 1 && (
              <nav
                className="mt-12 flex items-center justify-center gap-2"
                aria-label="Pagination"
              >
                {page > 1 && (
                  <Link
                    href={pageHref(page - 1)}
                    className="grid h-9 w-9 cursor-pointer place-items-center border border-[#171717]/15 text-[#171717]/55 transition-colors hover:border-[#171717] hover:text-[#171717]"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                )}
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  if (Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                    if (p === 2 || p === totalPages - 1) {
                      return (
                        <span key={p} className="px-1 text-xs text-[#171717]/35">
                          …
                        </span>
                      );
                    }
                    return null;
                  }
                  return (
                    <Link
                      key={p}
                      href={pageHref(p)}
                      className={
                        p === page
                          ? "grid h-9 min-w-9 cursor-pointer place-items-center border border-copper bg-copper/5 px-2 text-xs text-copper"
                          : "grid h-9 min-w-9 cursor-pointer place-items-center border border-[#171717]/15 px-2 text-xs text-[#171717]/55 transition-colors hover:border-[#171717] hover:text-[#171717]"
                      }
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </Link>
                  );
                })}
                {page < totalPages && (
                  <Link
                    href={pageHref(page + 1)}
                    className="grid h-9 w-9 cursor-pointer place-items-center border border-[#171717]/15 text-[#171717]/55 transition-colors hover:border-[#171717] hover:text-[#171717]"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
