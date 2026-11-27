import { type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CustomOrder } from "@/models";
import { requireAdminApi } from "@/lib/auth/admin";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { CUSTOM_ORDER_STATUSES } from "@/constants";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(CUSTOM_ORDER_STATUSES).optional(),
  internalNote: z.string().max(2000).optional(),
  estimatedCompletionDate: z.string().optional(),
});

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminApi("custom_orders.manage");
    requirePermission(session, "custom_orders.manage");
    const { id } = await props.params;
    const body = await request.json();
    const input = patchSchema.parse(body);

    await connectToDatabase();

    const order = await CustomOrder.findOne({ _id: id, deletedAt: null });
    if (!order) return jsonError("Not found", 404);

    if (input.status && input.status !== order.status) {
      order.status = input.status;
      (order.statusHistory as unknown as Array<Record<string, unknown>>).push({
        status: input.status,
        note: input.internalNote ?? `Status updated to ${input.status}`,
        changedBy: session.id,
        createdAt: new Date(),
      });
    }

    if (input.internalNote) {
      (order.internalNotes as unknown as Array<Record<string, unknown>>).push({
        note: input.internalNote,
        authorId: session.id,
        createdAt: new Date(),
      });
    }

    if (input.estimatedCompletionDate) {
      order.estimatedCompletionDate = new Date(input.estimatedCompletionDate);
    }

    await order.save();

    return jsonOk({ id: String(order._id), status: order.status });
  } catch (error) {
    return handleRouteError(error);
  }
}
