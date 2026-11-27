import "server-only";
import mongoose from "mongoose";
import { connection } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Collection } from "@/models/Collection";
import type { ProductFilterInput, PaginatedResult } from "@/types";

async function withDb() {
  await connection();
  await connectToDatabase();
}

// ─── Shared filter ────────────────────────────────────────────────────────────
const ACTIVE_FILTER = { status: "active", deletedAt: null } as const;

// ─── Serialisable plain-object types ─────────────────────────────────────────
export type PlainProduct = {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  images: { key: string; url: string; alt?: string; width?: number; height?: number }[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  status: string;
  badges: string[];
  materials: string[];
  specifications: { label: string; value: string }[];
  categoryIds: string[];
  collectionIds: string[];
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isCustomizable: boolean;
  averageRating: number;
  reviewCount: number;
  soldCount: number;
  variants: {
    _id: string;
    name: string;
    sku: string;
    price: number;
    compareAtPrice?: number;
    stock: number;
    isActive: boolean;
    options?: Record<string, string>;
  }[];
  createdAt: string;
};

export type PlainCategory = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { key: string; url: string; alt?: string };
  sortOrder: number;
};

export type PlainCollection = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { key: string; url: string; alt?: string };
  productIds: string[];
  isFeatured: boolean;
  sortOrder: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProduct(doc: any): PlainProduct {
  return {
    _id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    sku: doc.sku,
    description: doc.description,
    shortDescription: doc.shortDescription,
    images: (doc.images ?? []).map((img: any) => ({
      key: img.key,
      url: img.url,
      alt: img.alt,
      width: img.width,
      height: img.height,
    })),
    price: doc.price,
    compareAtPrice: doc.compareAtPrice,
    stock: doc.stock ?? 0,
    status: doc.status,
    badges: doc.badges ?? [],
    materials: doc.materials ?? [],
    specifications: (doc.specifications ?? []).map((s: any) => ({ label: s.label, value: s.value })),
    categoryIds: (doc.categoryIds ?? []).map(String),
    collectionIds: (doc.collectionIds ?? []).map(String),
    isFeatured: !!doc.isFeatured,
    isBestseller: !!doc.isBestseller,
    isNewArrival: !!doc.isNewArrival,
    isCustomizable: !!doc.isCustomizable,
    averageRating: doc.averageRating ?? 0,
    reviewCount: doc.reviewCount ?? 0,
    soldCount: doc.soldCount ?? 0,
    variants: (doc.variants ?? []).map((v: any) => ({
      _id: String(v._id),
      name: v.name,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock ?? 0,
      isActive: v.isActive ?? true,
      options: v.options ? Object.fromEntries(v.options) : undefined,
    })),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeCategory(doc: any): PlainCategory {
  return {
    _id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    image: doc.image ? { key: doc.image.key, url: doc.image.url, alt: doc.image.alt } : undefined,
    sortOrder: doc.sortOrder ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeCollection(doc: any): PlainCollection {
  return {
    _id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    image: doc.image ? { key: doc.image.key, url: doc.image.url, alt: doc.image.alt } : undefined,
    productIds: (doc.productIds ?? []).map(String),
    isFeatured: !!doc.isFeatured,
    sortOrder: doc.sortOrder ?? 0,
  };
}

// ─── Product queries ──────────────────────────────────────────────────────────
export async function getFeaturedProducts(limit = 6): Promise<PlainProduct[]> {
  await withDb();
  const docs = await Product.find({ ...ACTIVE_FILTER, isFeatured: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map(serializeProduct);
}

/** Prefer high-res local assets when seed/CMS product thumbs are tiny. */
const PRODUCT_COVER_OVERRIDES: Record<string, string> = {
  "forge-line-chef-knife-210": "/images/products/chef-bone-handle.jpg",
  "trailborn-camp-hatchet": "/images/products/skinner.jpg",
  "northridge-hunting-knife": "/images/products/tracker-hunter.jpg",
  "atelier-utility-blade": "/images/products/folding-blue.jpg",
  "cascade-damascus-gyuto": "/images/products/chef-bone-handle.jpg",
  "riverbend-fillet-knife": "/images/products/fish-folder.jpg",
  "vesper-viking-bearded-axe": "/images/products/axe-2.jpg",
};

function withPreferredCover(product: PlainProduct): PlainProduct {
  const override = PRODUCT_COVER_OVERRIDES[product.slug];
  if (!override) return product;
  const rest = product.images.filter((img) => img.url !== override);
  return {
    ...product,
    images: [{ key: override, url: override, alt: product.name }, ...rest],
  };
}

export async function getBestsellers(limit = 8): Promise<PlainProduct[]> {
  await withDb();
  const flagged = await Product.find({ ...ACTIVE_FILTER, isBestseller: true })
    .sort({ soldCount: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  let docs = flagged;
  if (docs.length < limit) {
    const exclude = docs.map((doc) => doc._id);
    const fillers = await Product.find({
      ...ACTIVE_FILTER,
      _id: { $nin: exclude },
    })
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(limit - docs.length)
      .lean();
    docs = [...docs, ...fillers];
  }

  return docs.map(serializeProduct).map(withPreferredCover);
}

export async function getNewArrivals(limit = 8): Promise<PlainProduct[]> {
  await withDb();
  const flagged = await Product.find({ ...ACTIVE_FILTER, isNewArrival: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  let docs = flagged;
  if (docs.length < limit) {
    const exclude = docs.map((doc) => doc._id);
    const fillers = await Product.find({
      ...ACTIVE_FILTER,
      _id: { $nin: exclude },
    })
      .sort({ createdAt: -1 })
      .limit(limit - docs.length)
      .lean();
    docs = [...docs, ...fillers];
  }

  return docs.map(serializeProduct).map(withPreferredCover);
}

export async function getProductBySlug(slug: string): Promise<PlainProduct | null> {
  await withDb();
  const doc = await Product.findOne({ slug, ...ACTIVE_FILTER }).lean();
  if (!doc) return null;
  return serializeProduct(doc);
}

export async function getRelatedProducts(
  productId: string,
  categoryIds: string[],
  limit = 4,
): Promise<PlainProduct[]> {
  await withDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = await Product.find({
    ...ACTIVE_FILTER,
    _id: { $ne: new mongoose.Types.ObjectId(productId) } as any,
    categoryIds: { $in: categoryIds },
  })
    .sort({ soldCount: -1 })
    .limit(limit)
    .lean();
  return docs.map(serializeProduct);
}

export async function listProducts(
  filters: ProductFilterInput = {},
): Promise<PaginatedResult<PlainProduct>> {
  await withDb();

  const {
    q,
    category,
    minPrice,
    maxPrice,
    inStock,
    sort = "newest",
    page = 1,
    pageSize = 16,
  } = filters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = { ...ACTIVE_FILTER };

  if (q) {
    query.$text = { $search: q };
  }

  if (category) {
    const cat = await Category.findOne({ slug: category, deletedAt: null }).lean();
    if (cat) query.categoryIds = cat._id;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = minPrice;
    if (maxPrice !== undefined) query.price.$lte = maxPrice;
  }

  if (inStock) {
    query.stock = { $gt: 0 };
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    name: { name: 1 },
    bestselling: { soldCount: -1 },
  };
  const sortQuery = sortMap[sort] ?? { createdAt: -1 };

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    Product.find(query).sort(sortQuery).skip(skip).limit(pageSize).lean(),
    Product.countDocuments(query),
  ]);

  return {
    items: docs.map(serializeProduct).map(withPreferredCover),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Category queries ─────────────────────────────────────────────────────────
export async function getCategories(): Promise<PlainCategory[]> {
  await withDb();
  const docs = await Category.find({ isActive: true, deletedAt: null })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return docs.map(serializeCategory);
}

export async function getCategoryBySlug(slug: string): Promise<PlainCategory | null> {
  await withDb();
  const doc = await Category.findOne({ slug, isActive: true, deletedAt: null }).lean();
  if (!doc) return null;
  return serializeCategory(doc);
}

/** Prefer these high-res local covers over tiny product thumbs (often 300px).
 *  Avoid chef-bone-handle — already used in the atelier section. */
const COLLECTION_COVER_FALLBACKS: Record<string, { url: string; alt: string }> = {
  "forge-essentials": {
    url: "/images/products/tracker-hunter.jpg",
    alt: "Forge essentials collection",
  },
  "field-camp": {
    url: "/images/products/skinner.jpg",
    alt: "Field and camp collection",
  },
};

// ─── Collection queries ───────────────────────────────────────────────────────
export async function getCollections(featuredOnly = false): Promise<PlainCollection[]> {
  await withDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { isActive: true, deletedAt: null };
  if (featuredOnly) filter.isFeatured = true;
  const docs = await Collection.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  const collections = docs.map(serializeCollection);

  const missingCoverIds = collections
    .filter((col) => !col.image?.url && col.productIds.length > 0)
    .flatMap((col) => col.productIds.slice(0, 1));

  const productCovers = new Map<string, { key: string; url: string; alt?: string }>();
  if (missingCoverIds.length > 0) {
    const products = await Product.find({ _id: { $in: missingCoverIds } })
      .select("images")
      .lean();
    for (const product of products as { _id: unknown; images?: { key?: string; url?: string; alt?: string }[] }[]) {
      const img = product.images?.find((image) => image.url);
      if (img?.url) {
        productCovers.set(String(product._id), {
          key: img.key || img.url,
          url: img.url,
          alt: img.alt,
        });
      }
    }
  }

  return collections.map((col, index) => {
    // Known homepage collections: always use curated high-res covers
    const bySlug = COLLECTION_COVER_FALLBACKS[col.slug];
    if (bySlug) {
      return { ...col, image: { key: bySlug.url, url: bySlug.url, alt: bySlug.alt } };
    }

    if (col.image?.url) return col;

    const fromProduct = col.productIds.map((id) => productCovers.get(id)).find(Boolean);
    if (fromProduct) return { ...col, image: fromProduct };

    const rotating = [
      "/images/products/folding-blue.jpg",
      "/images/products/tracker-hunter.jpg",
      "/images/products/chef-bone-handle.jpg",
    ];
    const url = rotating[index % rotating.length]!;
    return { ...col, image: { key: url, url, alt: col.name } };
  });
}

export async function getCollectionBySlug(slug: string): Promise<PlainCollection | null> {
  await withDb();
  const doc = await Collection.findOne({ slug, isActive: true, deletedAt: null }).lean();
  if (!doc) return null;
  const collection = serializeCollection(doc);
  const bySlug = COLLECTION_COVER_FALLBACKS[collection.slug];
  if (bySlug) {
    return { ...collection, image: { key: bySlug.url, url: bySlug.url, alt: bySlug.alt } };
  }
  if (collection.image?.url) return collection;

  if (collection.productIds[0]) {
    const product = await Product.findById(collection.productIds[0]).select("images name").lean();
    const img = product?.images?.find((image: { url?: string }) => image.url);
    if (img?.url) {
      return {
        ...collection,
        image: { key: img.key || img.url, url: img.url, alt: img.alt || collection.name },
      };
    }
  }

  return collection;
}

export async function getProductsForCollection(
  collectionId: string,
  productIds: string[] = [],
): Promise<PlainProduct[]> {
  await withDb();
  const objectIds = productIds
    .filter(Boolean)
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch {
        return null;
      }
    })
    .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

  let collectionObjectId: mongoose.Types.ObjectId | null = null;
  try {
    collectionObjectId = new mongoose.Types.ObjectId(collectionId);
  } catch {
    collectionObjectId = null;
  }

  const docs = await Product.find({
    ...ACTIVE_FILTER,
    $or: [
      ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
      ...(collectionObjectId ? [{ collectionIds: collectionObjectId }] : []),
    ],
  })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  return docs.map(serializeProduct).map(withPreferredCover);
}
