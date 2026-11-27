import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Testimonial } from "@/models/CMS";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonCreated, handleRouteError } from "@/lib/api";

const schema = z.object({
  authorName: z.string().min(1),
  authorTitle: z.string().optional(),
  quote: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminApi("cms.manage"); void session;
    await connectToDatabase();
    const docs = await Testimonial.find({ deletedAt: null }).sort({ sortOrder: 1 }).lean();
    return jsonOk(docs.map((d) => ({ id: String(d._id), authorName: d.authorName, authorTitle: d.authorTitle ?? null, quote: d.quote, rating: d.rating ?? 5, isFeatured: !!d.isFeatured, isActive: !!d.isActive, sortOrder: d.sortOrder ?? 0 })));
  } catch (err) { return handleRouteError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminApi("cms.manage");
    const data = schema.parse(await req.json());
    await connectToDatabase();
    const doc = await Testimonial.create({ ...data, isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0 });
    await writeAuditLog({ actor: session, action: "testimonial.create", entityType: "Testimonial", entityId: String(doc._id), summary: `Created testimonial by "${data.authorName}"` });
    return jsonCreated({ id: String(doc._id) });
  } catch (err) { return handleRouteError(err); }
}
