import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Coupon } from "@/models/Coupon";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonCreated, jsonError, handleRouteError } from "@/lib/api";

const schema = z.object({
  code: z.string().min(1).toUpperCase(),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(0),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminApi("marketing.manage"); void session;
    await connectToDatabase();
    const docs = await Coupon.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();
    return jsonOk(docs.map((d) => ({
      id: String(d._id),
      code: d.code,
      description: d.description ?? null,
      type: d.type,
      value: d.value,
      minOrderAmount: d.minOrderAmount ?? 0,
      usageLimit: d.usageLimit ?? null,
      usedCount: d.usedCount ?? 0,
      isActive: d.isActive ?? true,
      startsAt: d.startsAt ? new Date(String(d.startsAt)).toISOString() : null,
      endsAt: d.endsAt ? new Date(String(d.endsAt)).toISOString() : null,
    })));
  } catch (err) { return handleRouteError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("marketing.manage");
    const data = schema.parse(await req.json());
    await connectToDatabase();
    const existing = await Coupon.findOne({ code: data.code.toUpperCase(), deletedAt: null });
    if (existing) return jsonError("Coupon code already exists", 409);
    const doc = await Coupon.create({ ...data, code: data.code.toUpperCase(), isActive: data.isActive ?? true });
    await writeAuditLog({ actor: session, action: "coupon.create", entityType: "Coupon", entityId: String(doc._id), summary: `Created coupon "${data.code}"` });
    return jsonCreated({ id: String(doc._id) });
  } catch (err) { return handleRouteError(err); }
}
