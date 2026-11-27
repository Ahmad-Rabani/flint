export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { adminGetProductById, adminListCategoriesForSelect } from "@/features/products/admin-queries";
import { ProductForm } from "./product-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  await requireAdminSession("products.manage");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    adminGetProductById(id),
    adminListCategoriesForSelect(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">
        ← Products
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">{product.name}</h1>
          <p className="mt-1 font-mono text-xs text-[#171717]/40">{product.sku}</p>
        </div>
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          className="text-xs text-copper/60 hover:text-copper transition-colors"
        >
          View on store →
        </Link>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
