import { getSession } from "@/lib/auth/session";
import { handleRouteError, jsonCreated } from "@/lib/api";
import { checkoutSchema } from "@/lib/validation/checkout";
import { placeOnlineOrder } from "@/features/orders/service";
import { writeAuditLog } from "@/lib/auth/audit";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = checkoutSchema.parse(await request.json());
    const result = await placeOnlineOrder(body, session);

    await writeAuditLog({
      actor: session,
      action: "order.place",
      entityType: "Order",
      entityId: result.order.id,
      summary: `Placed order ${result.order.orderNumber}`,
    });

    return jsonCreated(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
