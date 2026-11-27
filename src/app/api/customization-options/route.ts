import { getCustomizationOptions } from "@/features/custom-orders/queries";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get("productType") ?? undefined;
    const options = await getCustomizationOptions(productType);
    return jsonOk({ options });
  } catch (error) {
    return handleRouteError(error);
  }
}
