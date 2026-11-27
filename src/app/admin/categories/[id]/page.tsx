export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Category } from "@/models/Category";
import { CategoryForm } from "../category-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditCategoryPage({ params }: Props) {
  await requireAdminSession("categories.manage");
  const { id } = await params;
  await connection();
  await connectToDatabase();

  const [doc, allCats] = await Promise.all([
    Category.findOne({ _id: id, deletedAt: null }).lean(),
    Category.find({ deletedAt: null }).sort({ name: 1 }).lean(),
  ]);
  if (!doc) notFound();

  const category = {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? null,
    parentId: doc.parentId ? String(doc.parentId) : null,
    sortOrder: doc.sortOrder ?? 0,
    isActive: doc.isActive ?? true,
    seoTitle: doc.seoTitle ?? null,
    seoDescription: doc.seoDescription ?? null,
  };
  const categories = allCats.map((c) => ({ id: String(c._id), name: c.name }));

  return (
    <div>
      <Link href="/admin/categories" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Categories</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">{category.name}</h1>
      <CategoryForm category={category} categories={categories} />
    </div>
  );
}
