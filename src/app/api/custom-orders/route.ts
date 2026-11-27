import { getSession } from "@/lib/auth/session";
import { handleRouteError, jsonCreated, jsonOk } from "@/lib/api";
import { customOrderSchema } from "@/lib/validation/custom-order";
import { submitCustomOrder } from "@/features/custom-orders/service";
import { getCustomerCustomOrders } from "@/features/custom-orders/queries";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const input = customOrderSchema.parse(body);
    const result = await submitCustomOrder(input, session);
    return jsonCreated(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonOk({ orders: [] });
    }
    const orders = await getCustomerCustomOrders(session);
    return jsonOk({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}
