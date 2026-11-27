export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { listProducts, getCategories } from "@/features/products/queries";
import { ProductCard } from "@/components/store/product-card";
import { CatalogueFilters } from "@/components/store/catalogue-filters";
import { formatCurrency } from "@/lib/utils";

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

const PAGE_SIZE = 16;

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
  const sort = (params.sort as "newest" | "price_asc" | "price_desc" | "name" | "bestselling") ?? "newest";

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

  // Build pagination href
  function pageHref(p: number) {
    const sp = new URLSearchParams(params as Record<string, string>);
    sp.set("page", String(p));
    return `/catalogue?${sp.toString()}`;
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Newest";

  return (
    <div className="pt-20 md:pt-24">
      {/* Page header */}
      <div className="bg-ink py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="editorial-rule mb-5" />
          <h1 className="font-heading text-4xl md:text-5xl text-ivory">
            {params.q ? `Results for "${params.q}"` : params.category ? `${categories.find((c) => c.slug === params.category)?.name ?? "Category"}` : "The Collection"}
          </h1>
          <p className="mt-3 text-sm text-ivory/50">
            {total} {total === 1 ? "piece" : "pieces"} available
          </p>
        </div>
      </div>

      {/* Layout */}
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-10 md:py-14">
        <div className="flex gap-10">
          {/* Sidebar — hidden on mobile */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <CatalogueFilters
              categories={categories}
              currentParams={params as Record<string, string>}
            />
          </aside>

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Mobile filter trigger */}
              <div className="lg:hidden">
                <CatalogueFilters
                  categories={categories}
                  currentParams={params as Record<string, string>}
                  mobile
                />
              </div>

              <p className="text-xs text-muted-foreground hidden sm:block">
                {total} result{total !== 1 ? "s" : ""}
              </p>

              {/* Sort */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sort:</span>
                <div className="flex gap-1 flex-wrap">
                  {SORT_OPTIONS.map((opt) => (
                    <Link
                      key={opt.value}
                      href={`/catalogue?${new URLSearchParams({ ...params as Record<string, string>, sort: opt.value, page: "1" }).toString()}`}
                      className={`text-xs px-3 py-1.5 border transition-colors ${
                        sort === opt.value
                          ? "border-copper text-copper bg-copper/5"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            {items.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7">
                {items.map((p, i) => (
                  <ProductCard key={p._id} product={p} priority={i < 4} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <p className="font-heading text-2xl mb-3">Nothing found.</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Try adjusting your filters or search term.
                </p>
                <Link
                  href="/catalogue"
                  className="text-xs uppercase tracking-widest text-copper hover:text-copper/70 transition-colors"
                >
                  Clear all filters
                </Link>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="mt-12 flex items-center justify-center gap-2"
                aria-label="Pagination"
              >
                {page > 1 && (
                  <Link
                    href={pageHref(page - 1)}
                    className="p-2 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                )}
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  if (Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                    if (p === 2 || p === totalPages - 1) {
                      return (
                        <span key={p} className="text-xs text-muted-foreground px-1">
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
                      className={`min-w-[2.25rem] h-9 flex items-center justify-center text-xs border transition-colors ${
                        p === page
                          ? "border-copper text-copper bg-copper/5"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </Link>
                  );
                })}
                {page < totalPages && (
                  <Link
                    href={pageHref(page + 1)}
                    className="p-2 border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
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
