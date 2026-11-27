export const instant = false;

import Link from "next/link";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Product } from "@/models/Product";
import { CollectionForm } from "../collection-form";

export default async function NewCollectionPage() {
  await requireAdminSession("collections.manage");
  await connection();
  await connectToDatabase();
  const docs = await Product.find({ status: "active", deletedAt: null }).sort({ name: 1 }).lean();
  const products = docs.map((p) => ({ id: String(p._id), name: p.name, sku: p.sku }));

  return (
    <div>
      <Link href="/admin/collections" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Collections</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">New Collection</h1>
      <CollectionForm products={products} />
    </div>
  );
}
