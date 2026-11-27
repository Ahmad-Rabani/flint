import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { handleRouteError, jsonOk } from "@/lib/api";
import { searchInventoryProducts } from "@/features/inventory/queries";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi("inventory.view");
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const items = await searchInventoryProducts(q, 12);
    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
