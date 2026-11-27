import { type NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CustomOrder, Quotation } from "@/models";
import { requireAdminApi } from "@/lib/auth/admin";
import { handleRouteError, jsonCreated, jsonError } from "@/lib/api";
import { requirePermission } from "@/lib/permissions";
import { quotationNumber } from "@/lib/ids";
import { z } from "zod";

const quotationSchema = z.object({
  amount: z.number().min(1, "Amount is required"),
  currency: z.string().default("USD"),
  depositAmount: z.number().min(0).optional(),
  message: z.string().max(2000).optional(),
  validUntil: z.string().optional(),
  estimatedDays: z.number().min(1).optional(),
  lineItems: z
    .array(
      z.object({
        label: z.string(),
        amount: z.number(),
      }),
    )
    .optional(),
  markAsSent: z.boolean().default(false),
});

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminApi("quotations.manage");
    requirePermission(session, "quotations.manage");
    const { id } = await props.params;
    const body = await request.json();
    const input = quotationSchema.parse(body);

    await connectToDatabase();

    const order = await CustomOrder.findOne({ _id: id, deletedAt: null });
    if (!order) return jsonError("Custom order not found", 404);

    const quotation = await Quotation.create({
      quotationNumber: quotationNumber(),
      customOrderId: new Types.ObjectId(id),
      customerId: order.customerId,
      amount: input.amount,
      currency: input.currency,
      depositAmount: input.depositAmount ?? 0,
      message: input.message,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      estimatedDays: input.estimatedDays,
      lineItems: input.lineItems ?? [],
      status: input.markAsSent ? "sent" : "draft",
      sentAt: input.markAsSent ? new Date() : undefined,
      createdBy: new Types.ObjectId(session.id),
    });

    // Link quotation to order and update status if sent
    order.quotationId = quotation._id;
    if (input.markAsSent && order.status !== "quotation_sent") {
      order.status = "quotation_sent";
      (order.statusHistory as unknown as Array<Record<string, unknown>>).push({
        status: "quotation_sent",
        note: "Quotation sent to customer",
        changedBy: session.id,
        createdAt: new Date(),
      });
    }
    await order.save();

    return jsonCreated({
      id: String(quotation._id),
      quotationNumber: quotation.quotationNumber,
      status: quotation.status,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
