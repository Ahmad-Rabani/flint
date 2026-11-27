import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Product } from "@/models/Product";
import { writeAuditLog } from "@/lib/auth/audit";
import { slugify } from "@/lib/utils";
import { jsonOk, jsonCreated, jsonError, handleRouteError } from "@/lib/api";
import { PRODUCT_STATUSES } from "@/constants";
import { nanoid } from "nanoid";

const createProductSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  description: z.string().min(10),
  shortDescription: z.string().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  categoryIds: z.array(z.string()).optional(),
  badges: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  specifications: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  isFeatured: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isCustomizable: z.boolean().optional(),
  images: z.array(z.object({ key: z.string(), url: z.string(), alt: z.string().optional() })).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  slug: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi("products.view");
    void session;
    await connectToDatabase();

    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q");
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "30");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { deletedAt: null };
    if (q) filter.$text = { $search: q };
    if (status) filter.status = status;

    const skip = (page - 1) * pageSize;
    const [docs, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Product.countDocuments(filter),
    ]);

    return jsonOk({
      items: docs.map((d) => ({
        id: String(d._id),
        name: d.name,
        slug: d.slug,
        sku: d.sku,
        price: d.price,
        stock: d.stock ?? 0,
        status: d.status,
        imageUrl: (d.images as { url: string }[])?.[0]?.url ?? null,
        createdAt: d.createdAt ? new Date(String(d.createdAt)).toISOString() : "",
      })),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("products.manage");
    const body = await req.json();
    const data = createProductSchema.parse(body);

    await connectToDatabase();

    // Check SKU uniqueness
    const existing = await Product.findOne({ sku: data.sku });
    if (existing) return jsonError("SKU already exists", 409);

    const slug = data.slug ?? slugify(data.name) + "-" + nanoid(4);
    const slugExists = await Product.findOne({ slug });
    const finalSlug = slugExists ? slug + "-" + nanoid(4) : slug;

    const product = await Product.create({
      ...data,
      slug: finalSlug,
      status: data.status ?? "draft",
      stock: data.stock ?? 0,
      minStockLevel: data.minStockLevel ?? 5,
      costPrice: data.costPrice ?? 0,
    });

    await writeAuditLog({
      actor: session,
      action: "product.create",
      entityType: "Product",
      entityId: String(product._id),
      summary: `Created product "${data.name}"`,
    });

    return jsonCreated({ id: String(product._id), slug: product.slug });
  } catch (err) {
    return handleRouteError(err);
  }
}
