import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Product } from "@/models/Product";
import { writeAuditLog } from "@/lib/auth/audit";
import { slugify } from "@/lib/utils";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";
import { PRODUCT_STATUSES } from "@/constants";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  sku: z.string().min(1).optional(),
  barcode: z.string().optional(),
  description: z.string().min(10).optional(),
  shortDescription: z.string().optional(),
  price: z.number().min(0).optional(),
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
});

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("products.view");
    void session;
    const { id } = await params;
    await connectToDatabase();
    const doc = await Product.findOne({ _id: id, deletedAt: null }).lean();
    if (!doc) return jsonError("Not found", 404);
    return jsonOk(doc);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("products.manage");
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    await connectToDatabase();

    const product = await Product.findOne({ _id: id, deletedAt: null });
    if (!product) return jsonError("Not found", 404);

    // If name changed and no explicit slug, update slug
    if (data.name && !data.slug) {
      data.slug = slugify(data.name);
      const slugExists = await Product.findOne({ slug: data.slug, _id: { $ne: id } });
      if (slugExists) delete data.slug;
    }

    Object.assign(product, data);
    await product.save();

    await writeAuditLog({
      actor: session,
      action: "product.update",
      entityType: "Product",
      entityId: id,
      summary: `Updated product "${product.name}"`,
      changes: data,
    });

    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("products.manage");
    const { id } = await params;
    await connectToDatabase();

    const product = await Product.findOne({ _id: id, deletedAt: null });
    if (!product) return jsonError("Not found", 404);

    product.deletedAt = new Date();
    product.status = "archived";
    await product.save();

    await writeAuditLog({
      actor: session,
      action: "product.delete",
      entityType: "Product",
      entityId: id,
      summary: `Archived product "${product.name}"`,
    });

    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}
