import "server-only";
import { connection } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  minStockLevel: number;
  status: string;
  imageUrl?: string;
  createdAt: string;
};

export type AdminProductDetail = AdminProductListItem & {
  barcode?: string;
  description: string;
  shortDescription?: string;
  compareAtPrice?: number;
  costPrice: number;
  categoryIds: string[];
  badges: string[];
  materials: string[];
  specifications: { label: string; value: string }[];
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isCustomizable: boolean;
  images: { key: string; url: string; alt?: string }[];
  seoTitle?: string;
  seoDescription?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(doc: any): AdminProductDetail {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    sku: doc.sku,
    barcode: doc.barcode ?? undefined,
    description: doc.description,
    shortDescription: doc.shortDescription ?? undefined,
    price: doc.price,
    compareAtPrice: doc.compareAtPrice ?? undefined,
    costPrice: doc.costPrice ?? 0,
    stock: doc.stock ?? 0,
    minStockLevel: doc.minStockLevel ?? 5,
    status: doc.status,
    categoryIds: (doc.categoryIds ?? []).map(String),
    badges: doc.badges ?? [],
    materials: doc.materials ?? [],
    specifications: (doc.specifications ?? []).map((s: { label: string; value: string }) => ({
      label: s.label,
      value: s.value,
    })),
    isFeatured: !!doc.isFeatured,
    isBestseller: !!doc.isBestseller,
    isNewArrival: !!doc.isNewArrival,
    isCustomizable: !!doc.isCustomizable,
    images: (doc.images ?? []).map((img: { key: string; url: string; alt?: string }) => ({
      key: img.key,
      url: img.url,
      alt: img.alt,
    })),
    imageUrl: doc.images?.[0]?.url ?? undefined,
    seoTitle: doc.seoTitle ?? undefined,
    seoDescription: doc.seoDescription ?? undefined,
    createdAt: doc.createdAt ? new Date(String(doc.createdAt)).toISOString() : "",
  };
}

export async function adminListProducts(params: {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: AdminProductListItem[]; total: number }> {
  await connection();
  await connectToDatabase();

  const { q, status, page = 1, pageSize = 30 } = params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { deletedAt: null };
  if (q) filter.$text = { $search: q };
  if (status) filter.status = status;

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      slug: doc.slug,
      sku: doc.sku,
      price: doc.price,
      stock: doc.stock ?? 0,
      minStockLevel: doc.minStockLevel ?? 5,
      status: doc.status,
      imageUrl: (doc.images as { url: string }[])?.[0]?.url ?? undefined,
      createdAt: doc.createdAt ? new Date(String(doc.createdAt)).toISOString() : "",
    })),
    total,
  };
}

export async function adminGetProductById(id: string): Promise<AdminProductDetail | null> {
  await connection();
  await connectToDatabase();
  const doc = await Product.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) return null;
  return serialize(doc);
}

export async function adminListCategoriesForSelect(): Promise<{ id: string; name: string }[]> {
  await connectToDatabase();
  const docs = await Category.find({ deletedAt: null }).sort({ name: 1 }).lean();
  return docs.map((c) => ({ id: String(c._id), name: c.name }));
}
