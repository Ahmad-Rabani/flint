import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { handleRouteError, jsonOk } from "@/lib/api";
import { searchPosCustomers } from "@/features/pos/queries";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi("pos.access");
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const items = await searchPosCustomers(q);
    return jsonOk({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
