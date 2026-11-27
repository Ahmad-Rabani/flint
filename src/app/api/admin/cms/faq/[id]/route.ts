import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { FAQ } from "@/models/CMS";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  category: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("cms.manage");
    const { id } = await params;
    const data = schema.parse(await req.json());
    await connectToDatabase();
    const doc = await FAQ.findOne({ _id: id, deletedAt: null });
    if (!doc) return jsonError("Not found", 404);
    Object.assign(doc, data);
    await doc.save();
    await writeAuditLog({ actor: session, action: "faq.update", entityType: "FAQ", entityId: id, summary: `Updated FAQ` });
    return jsonOk({ id });
  } catch (err) { return handleRouteError(err); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("cms.manage");
    const { id } = await params;
    await connectToDatabase();
    const doc = await FAQ.findOne({ _id: id, deletedAt: null });
    if (!doc) return jsonError("Not found", 404);
    doc.deletedAt = new Date();
    await doc.save();
    await writeAuditLog({ actor: session, action: "faq.delete", entityType: "FAQ", entityId: id, summary: `Deleted FAQ` });
    return jsonOk({ id });
  } catch (err) { return handleRouteError(err); }
}
