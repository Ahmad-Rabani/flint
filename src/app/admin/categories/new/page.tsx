export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Category } from "@/models/Category";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  await requireAdminSession("categories.manage");
  await connection();
  await connectToDatabase();
  const cats = await Category.find({ deletedAt: null }).sort({ name: 1 }).lean();
  const categories = cats.map((c) => ({ id: String(c._id), name: c.name }));

  return (
    <div>
      <Link href="/admin/categories" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Categories</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">New Category</h1>
      <CategoryForm categories={categories} />
    </div>
  );
}
