export const instant = false;

import { connection } from "next/server";
import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Category } from "@/models/Category";
import { CategoryRowActions } from "./category-row-actions";

async function getCategories() {
  await connection();
  await connectToDatabase();
  const docs = await Category.find({ deletedAt: null }).sort({ sortOrder: 1, name: 1 }).lean();
  return docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    description: d.description ?? null,
    parentId: d.parentId ? String(d.parentId) : null,
    sortOrder: d.sortOrder ?? 0,
    isActive: d.isActive ?? true,
  }));
}

export default async function AdminCategoriesPage() {
  await requireAdminSession("categories.manage");
  const categories = await getCategories();

  const parentMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Categories</h1>
          <p className="mt-1 text-sm text-[#171717]/50">{categories.length} total</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="border border-[#171717] bg-[#171717] px-4 py-2 text-sm text-ivory hover:bg-[#171717]/90 transition-colors"
        >
          + New Category
        </Link>
      </div>

      <div className="mt-6 border border-[#171717]/10 bg-white overflow-x-auto">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/30">No categories yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Name</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Slug</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Parent</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Order</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Active</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#171717]/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#171717]">{cat.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#171717]/50">{cat.slug}</td>
                  <td className="px-4 py-3 text-[#171717]/50">
                    {cat.parentId ? parentMap[cat.parentId] ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#171717]/50">{cat.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${cat.isActive ? "text-green-600" : "text-[#171717]/30"}`}>
                      {cat.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-3">
                    <Link href={`/admin/categories/${cat.id}`} className="text-xs text-copper/60 hover:text-copper transition-colors">
                      Edit
                    </Link>
                    <CategoryRowActions id={cat.id} name={cat.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
