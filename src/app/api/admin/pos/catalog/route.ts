import { requireAdminApi } from "@/lib/auth/admin";
import { handleRouteError, jsonOk } from "@/lib/api";
import { listPosCatalog } from "@/features/pos/queries";

export async function GET() {
  try {
    await requireAdminApi("pos.access");
    const catalog = await listPosCatalog();
    return jsonOk(catalog);
  } catch (error) {
    return handleRouteError(error);
  }
}
