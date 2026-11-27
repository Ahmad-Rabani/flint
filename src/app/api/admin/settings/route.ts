import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { BusinessSettings } from "@/models/BusinessSettings";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, handleRouteError } from "@/lib/api";

const schema = z.object({
  businessName: z.string().optional(),
  legalName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currency: z.string().length(3).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxInclusive: z.boolean().optional(),
  paymentMethods: z.array(z.object({ id: z.string(), label: z.string(), enabled: z.boolean() })).optional(),
  shipping: z.object({
    flatRate: z.number().min(0).optional(),
    freeOver: z.number().min(0).optional(),
    estimatedDaysMin: z.number().int().min(0).optional(),
    estimatedDaysMax: z.number().int().min(0).optional(),
  }).optional(),
  notifications: z.object({
    orderEmail: z.boolean().optional(),
    lowStockEmail: z.boolean().optional(),
    customOrderEmail: z.boolean().optional(),
  }).optional(),
  seo: z.object({
    defaultTitle: z.string().optional(),
    defaultDescription: z.string().optional(),
  }).optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminApi("settings.view"); void session;
    await connectToDatabase();
    const doc = await BusinessSettings.findOne({ key: "default" }).lean();
    return jsonOk(doc ?? {});
  } catch (err) { return handleRouteError(err); }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminApi("settings.manage");
    const data = schema.parse(await req.json());
    await connectToDatabase();
    const settings = await BusinessSettings.findOneAndUpdate(
      { key: "default" },
      { $set: data },
      { new: true, upsert: true }
    );
    await writeAuditLog({ actor: session, action: "settings.update", entityType: "BusinessSettings", entityId: String(settings._id), summary: "Updated business settings" });
    return jsonOk({ id: String(settings._id) });
  } catch (err) { return handleRouteError(err); }
}
