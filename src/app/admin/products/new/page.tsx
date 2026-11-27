export const instant = false;

import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/admin";
import { adminListCategoriesForSelect } from "@/features/products/admin-queries";
import { ProductForm } from "../[id]/product-form";

export default async function NewProductPage() {
  await requireAdminSession("products.manage");
  const categories = await adminListCategoriesForSelect();

  return (
    <div>
      <Link href="/admin/products" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">
        ← Products
      </Link>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">New Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
