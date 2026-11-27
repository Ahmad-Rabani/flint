import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CustomOrder, Customer, CustomizationOption } from "@/models";
import { customOrderNumber } from "@/lib/ids";
import type { CustomOrderInput } from "@/lib/validation/custom-order";
import type { SessionUser } from "@/types";

export async function submitCustomOrder(
  input: CustomOrderInput,
  session: SessionUser | null,
): Promise<{ id: string; orderNumber: string }> {
  await connectToDatabase();

  // Validate option keys from DB if preferences provided
  if (input.preferences && Object.keys(input.preferences).length > 0) {
    const keys = Object.keys(input.preferences);
    const opts = await CustomizationOption.find({
      key: { $in: keys },
      isActive: true,
      deletedAt: null,
    }).lean();
    const validKeys = new Set(opts.map((o) => o.key));
    for (const key of keys) {
      if (!validKeys.has(key)) {
        throw new Error(`Unknown customization option: ${key}`);
      }
    }
  }

  // Resolve customerId
  let customerId: Types.ObjectId | undefined;
  if (session?.customerId) {
    customerId = new Types.ObjectId(session.customerId);
  } else {
    const existing = await Customer.findOne({
      email: input.customerEmail.toLowerCase(),
      deletedAt: null,
    }).lean();
    if (existing) {
      customerId = existing._id;
    }
  }

  const prefsMap: Record<string, string> = {};
  if (input.preferences) {
    for (const [k, v] of Object.entries(input.preferences)) {
      prefsMap[k] = v;
    }
  }

  const order = await CustomOrder.create({
    orderNumber: customOrderNumber(),
    customerId,
    userId: session?.id ? new Types.ObjectId(session.id) : undefined,
    productType: input.productType,
    designStyle: input.designStyle,
    preferences: prefsMap,
    referenceImages: input.referenceImages ?? [],
    customerName: input.customerName,
    customerEmail: input.customerEmail.toLowerCase(),
    customerPhone: input.customerPhone,
    description: input.description,
    intendedUse: input.intendedUse,
    budgetMin: input.budgetMin,
    budgetMax: input.budgetMax,
    preferredDeliveryDate: input.preferredDeliveryDate
      ? new Date(input.preferredDeliveryDate)
      : undefined,
    additionalComments: input.additionalComments,
    status: "submitted",
    statusHistory: [
      {
        status: "submitted",
        note: "Request submitted by customer",
        createdAt: new Date(),
      },
    ],
  });

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
  };
}
