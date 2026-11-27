import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Category } from "@/models/Category";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("categories.manage");
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    await connectToDatabase();
    const cat = await Category.findOne({ _id: id, deletedAt: null });
    if (!cat) return jsonError("Not found", 404);
    Object.assign(cat, data);
    await cat.save();
    await writeAuditLog({ actor: session, action: "category.update", entityType: "Category", entityId: id, summary: `Updated category "${cat.name}"` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("categories.manage");
    const { id } = await params;
    await connectToDatabase();
    const cat = await Category.findOne({ _id: id, deletedAt: null });
    if (!cat) return jsonError("Not found", 404);
    cat.deletedAt = new Date();
    await cat.save();
    await writeAuditLog({ actor: session, action: "category.delete", entityType: "Category", entityId: id, summary: `Deleted category "${cat.name}"` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}
