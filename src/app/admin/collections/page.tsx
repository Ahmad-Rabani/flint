export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Collection } from "@/models/Collection";
import { CollectionRowActions } from "./collection-row-actions";

export default async function AdminCollectionsPage() {
  await requireAdminSession("collections.manage");
  await connection();
  await connectToDatabase();
  const docs = await Collection.find({ deletedAt: null }).sort({ sortOrder: 1, name: 1 }).lean();

  const items = docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    isFeatured: !!d.isFeatured,
    isActive: !!d.isActive,
    sortOrder: d.sortOrder ?? 0,
    productCount: (d.productIds ?? []).length,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Collections</h1>
          <p className="mt-1 text-sm text-[#171717]/50">{items.length} total</p>
        </div>
        <Link href="/admin/collections/new" className="border border-[#171717] bg-[#171717] px-4 py-2 text-sm text-ivory hover:bg-[#171717]/90 transition-colors">
          + New Collection
        </Link>
      </div>

      <div className="mt-6 border border-[#171717]/10 bg-white overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#171717]/30">No collections yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#171717]/10">
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Name</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Products</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Featured</th>
                <th className="px-4 pb-3 pt-4 text-left text-xs uppercase tracking-widest font-normal text-[#171717]/40">Active</th>
                <th className="px-4 pb-3 pt-4 text-right text-xs uppercase tracking-widest font-normal text-[#171717]/40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171717]/5">
              {items.map((col) => (
                <tr key={col.id} className="hover:bg-[#171717]/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#171717]">{col.name}</p>
                    <p className="font-mono text-xs text-[#171717]/40">{col.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[#171717]/60">{col.productCount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${col.isFeatured ? "text-copper" : "text-[#171717]/30"}`}>
                      {col.isFeatured ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${col.isActive ? "text-green-600" : "text-[#171717]/30"}`}>
                      {col.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-3">
                    <Link href={`/admin/collections/${col.id}`} className="text-xs text-copper/60 hover:text-copper transition-colors">Edit</Link>
                    <CollectionRowActions id={col.id} name={col.name} />
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
