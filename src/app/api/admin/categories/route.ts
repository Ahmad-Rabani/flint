import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Category } from "@/models/Category";
import { writeAuditLog } from "@/lib/auth/audit";
import { slugify } from "@/lib/utils";
import { jsonOk, jsonCreated, jsonError, handleRouteError } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminSession("categories.manage");
    void session;
    await connectToDatabase();
    const docs = await Category.find({ deletedAt: null }).sort({ sortOrder: 1, name: 1 }).lean();
    return jsonOk(docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      slug: d.slug,
      description: d.description ?? null,
      parentId: d.parentId ? String(d.parentId) : null,
      sortOrder: d.sortOrder ?? 0,
      isActive: d.isActive ?? true,
    })));
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession("categories.manage");
    const body = await req.json();
    const data = schema.parse(body);
    await connectToDatabase();

    const slug = data.slug ?? slugify(data.name);
    const existing = await Category.findOne({ slug, deletedAt: null });
    if (existing) return jsonError("Slug already exists", 409);

    const cat = await Category.create({
      ...data,
      slug,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    });

    await writeAuditLog({ actor: session, action: "category.create", entityType: "Category", entityId: String(cat._id), summary: `Created category "${data.name}"` });
    return jsonCreated({ id: String(cat._id) });
  } catch (err) {
    return handleRouteError(err);
  }
}
