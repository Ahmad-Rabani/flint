import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Review } from "@/models/Review";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  isApproved: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("reviews.manage");
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    await connectToDatabase();
    const review = await Review.findOne({ _id: id, deletedAt: null });
    if (!review) return jsonError("Not found", 404);
    Object.assign(review, data);
    await review.save();
    await writeAuditLog({ actor: session, action: "review.update", entityType: "Review", entityId: id, summary: `Updated review` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("reviews.manage");
    const { id } = await params;
    await connectToDatabase();
    const review = await Review.findOne({ _id: id, deletedAt: null });
    if (!review) return jsonError("Not found", 404);
    review.deletedAt = new Date();
    await review.save();
    await writeAuditLog({ actor: session, action: "review.delete", entityType: "Review", entityId: id, summary: `Deleted review` });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}
