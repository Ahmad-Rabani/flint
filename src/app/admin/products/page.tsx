export const instant = false;

import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/admin";
import { adminListProducts } from "@/features/products/admin-queries";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-600",
  out_of_stock: "bg-red-100 text-red-700",
};

type Props = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdminSession("products.view");
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const page = Number(sp.page ?? "1");

  const { items, total } = await adminListProducts({ q, status, page, pageSize: 30 });
  const totalPages = Math.ceil(total / 30);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Products</h1>
          <p className="mt-1 text-sm text-[#171717]/50">{total} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="border border-[#171717] bg-[#171717] px-4 py-2 text-sm text-ivory hover:bg-[#171717]/90 transition-colors"
        >
          + New Product
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="mt-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none w-56"
        />
        <select
          name="status"
          defaultValue={status}
          className="border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] focus:border-copper focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        <button
          type="submit"
          className="border border-[#171717]/20 px-4 py-2 text-sm text-[#171717]/60 hover:border-copper hover:text-copper transition-colors"
        >
          Search
        </button>
        {(q || status) && (
          <Link href="/admin/products" className="px-4 py-2 text-sm text-[#171717]/40 hover:text-[#171717] transition-colors">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="mt-6 overflow-x-auto border border-[#171717]/10 bg-white">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/30">
            {q || status ? "No products match your filters." : "No products yet."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Product</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">SKU</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Price</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Stock</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Status</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Created</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {items.map((product) => (
                <tr key={product.id} className="hover:bg-[#171717]/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 object-cover border border-[#171717]/10 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 border border-[#171717]/10 bg-[#171717]/5 shrink-0 flex items-center justify-center text-[#171717]/20 text-xs">
                          —
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-[#171717] hover:text-copper transition-colors"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-[#171717]/40">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#171717]/60">{product.sku}</td>
                  <td className="px-4 py-3 text-[#171717]">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-sm font-medium",
                      product.stock <= product.minStockLevel ? "text-red-600" : "text-[#171717]"
                    )}>
                      {product.stock}
                    </span>
                    {product.stock <= product.minStockLevel && (
                      <span className="ml-1.5 text-xs text-red-500">low</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-block rounded-sm px-2 py-0.5 text-xs capitalize",
                      STATUS_COLORS[product.status] ?? "bg-gray-100 text-gray-600"
                    )}>
                      {product.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#171717]/40">
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-xs text-copper/60 hover:text-copper transition-colors"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(p) })}`}
              className={cn(
                "border px-3 py-1.5 text-sm transition-colors",
                p === page
                  ? "border-[#171717] bg-[#171717] text-ivory"
                  : "border-[#171717]/20 text-[#171717]/60 hover:border-copper hover:text-copper"
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
