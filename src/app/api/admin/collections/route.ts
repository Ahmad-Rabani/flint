import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Collection } from "@/models/Collection";
import { writeAuditLog } from "@/lib/auth/audit";
import { slugify } from "@/lib/utils";
import { jsonOk, jsonCreated, jsonError, handleRouteError } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminApi("collections.manage");
    void session;
    await connectToDatabase();
    const docs = await Collection.find({ deletedAt: null }).sort({ sortOrder: 1, name: 1 }).lean();
    return jsonOk(docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      slug: d.slug,
      isFeatured: d.isFeatured,
      isActive: d.isActive,
      sortOrder: d.sortOrder ?? 0,
      productCount: (d.productIds ?? []).length,
    })));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("collections.manage");
    const body = await req.json();
    const data = schema.parse(body);
    await connectToDatabase();

    const slug = data.slug ?? slugify(data.name);
    const existing = await Collection.findOne({ slug, deletedAt: null });
    if (existing) return jsonError("Slug already exists", 409);

    const col = await Collection.create({ ...data, slug, isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0 });
    await writeAuditLog({ actor: session, action: "collection.create", entityType: "Collection", entityId: String(col._id), summary: `Created collection "${data.name}"` });
    return jsonCreated({ id: String(col._id) });
  } catch (err) {
    return handleRouteError(err);
  }
}
