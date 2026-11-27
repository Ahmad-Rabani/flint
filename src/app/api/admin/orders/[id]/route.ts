import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Order } from "@/models/Order";
import { writeAuditLog } from "@/lib/auth/audit";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api";
import { ORDER_STATUSES } from "@/constants";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(["unpaid", "pending", "paid", "partially_refunded", "refunded", "failed"]).optional(),
  internalNotes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("orders.manage");
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    await connectToDatabase();
    const order = await Order.findOne({ _id: id, deletedAt: null });
    if (!order) return jsonError("Not found", 404);
    Object.assign(order, data);
    await order.save();
    await writeAuditLog({
      actor: session,
      action: "order.update",
      entityType: "Order",
      entityId: id,
      summary: `Updated order ${order.orderNumber}: ${JSON.stringify(data)}`,
      changes: data,
    });
    return jsonOk({ id });
  } catch (err) {
    return handleRouteError(err);
  }
}
