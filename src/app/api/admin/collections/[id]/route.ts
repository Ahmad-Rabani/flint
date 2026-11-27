import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Collection } from "@/models/Collection";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("collections.manage");
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    await connectToDatabase();
    const col = await Collection.findOne({ _id: id, deletedAt: null });
    if (!col) return jsonError("Not found", 404);
    Object.assign(col, data);
    await col.save();
    await writeAuditLog({ actor: session, action: "collection.update", entityType: "Collection", entityId: id, summary: `Updated collection "${col.name}"` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("collections.manage");
    const { id } = await params;
    await connectToDatabase();
    const col = await Collection.findOne({ _id: id, deletedAt: null });
    if (!col) return jsonError("Not found", 404);
    col.deletedAt = new Date();
    await col.save();
    await writeAuditLog({ actor: session, action: "collection.delete", entityType: "Collection", entityId: id, summary: `Deleted collection "${col.name}"` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}
