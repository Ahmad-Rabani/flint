import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Coupon } from "@/models/Coupon";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed"]).optional(),
  value: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("marketing.manage");
    const { id } = await params;
    const data = schema.parse(await req.json());
    await connectToDatabase();
    const doc = await Coupon.findOne({ _id: id, deletedAt: null });
    if (!doc) return jsonError("Not found", 404);
    Object.assign(doc, data);
    await doc.save();
    await writeAuditLog({ actor: session, action: "coupon.update", entityType: "Coupon", entityId: id, summary: `Updated coupon "${doc.code}"` });
    return jsonOk({ id });
  } catch (err) { return handleRouteError(err); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("marketing.manage");
    const { id } = await params;
    await connectToDatabase();
    const doc = await Coupon.findOne({ _id: id, deletedAt: null });
    if (!doc) return jsonError("Not found", 404);
    doc.deletedAt = new Date();
    await doc.save();
    await writeAuditLog({ actor: session, action: "coupon.delete", entityType: "Coupon", entityId: id, summary: `Deleted coupon "${doc.code}"` });
    return jsonOk({ id });
  } catch (err) { return handleRouteError(err); }
}
