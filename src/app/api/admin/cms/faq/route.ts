import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { FAQ } from "@/models/CMS";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonCreated, handleRouteError } from "@/lib/api";

const schema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAdminSession("cms.manage"); void session;
    await connectToDatabase();
    const docs = await FAQ.find({ deletedAt: null }).sort({ sortOrder: 1, createdAt: 1 }).lean();
    return jsonOk(docs.map((d) => ({ id: String(d._id), question: d.question, answer: d.answer, category: d.category ?? null, sortOrder: d.sortOrder ?? 0, isActive: d.isActive ?? true })));
  } catch (err) { return handleRouteError(err); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession("cms.manage");
    const data = schema.parse(await req.json());
    await connectToDatabase();
    const doc = await FAQ.create({ ...data, isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0 });
    await writeAuditLog({ actor: session, action: "faq.create", entityType: "FAQ", entityId: String(doc._id), summary: `Created FAQ` });
    return jsonCreated({ id: String(doc._id) });
  } catch (err) { return handleRouteError(err); }
}
