import { getSession } from "@/lib/auth/session";
import { handleRouteError, jsonCreated } from "@/lib/api";
import { checkoutSchema } from "@/lib/validation/checkout";
import { placeOnlineOrder } from "@/features/orders/service";
import { writeAuditLog } from "@/lib/auth/audit";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit({
      key: `checkout:${clientIp(request)}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    if (!limit.ok) return tooManyRequests(limit.retryAfterSec);

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
