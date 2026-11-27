export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Collection } from "@/models/Collection";
import { Product } from "@/models/Product";
import { CollectionForm } from "../collection-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditCollectionPage({ params }: Props) {
  await requireAdminSession("collections.manage");
  const { id } = await params;
  await connection();
  await connectToDatabase();

  const [doc, productDocs] = await Promise.all([
    Collection.findOne({ _id: id, deletedAt: null }).lean(),
    Product.find({ status: "active", deletedAt: null }).sort({ name: 1 }).lean(),
  ]);
  if (!doc) notFound();

  const collection = {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? null,
    productIds: (doc.productIds ?? []).map(String),
    isFeatured: !!doc.isFeatured,
    isActive: !!doc.isActive,
    sortOrder: doc.sortOrder ?? 0,
  };
  const products = productDocs.map((p) => ({ id: String(p._id), name: p.name, sku: p.sku }));

  return (
    <div>
      <Link href="/admin/collections" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Collections</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">{collection.name}</h1>
      <CollectionForm collection={collection} products={products} />
    </div>
  );
}
