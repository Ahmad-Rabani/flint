import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Testimonial } from "@/models/CMS";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  authorName: z.string().min(1).optional(),
  authorTitle: z.string().optional(),
  quote: z.string().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession("cms.manage");
    const { id } = await params;
    const data = schema.parse(await req.json());
    await connectToDatabase();
    const doc = await Testimonial.findOne({ _id: id, deletedAt: null });
    if (!doc) return jsonError("Not found", 404);
    Object.assign(doc, data);
    await doc.save();
    await writeAuditLog({ actor: session, action: "testimonial.update", entityType: "Testimonial", entityId: id, summary: `Updated testimonial` });
    return jsonOk({ id });
  } catch (err) { return handleRouteError(err); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession("cms.manage");
    const { id } = await params;
    await connectToDatabase();
    const doc = await Testimonial.findOne({ _id: id, deletedAt: null });
    if (!doc) return jsonError("Not found", 404);
    doc.deletedAt = new Date();
    await doc.save();
    await writeAuditLog({ actor: session, action: "testimonial.delete", entityType: "Testimonial", entityId: id, summary: `Deleted testimonial` });
    return jsonOk({ id });
  } catch (err) { return handleRouteError(err); }
}
