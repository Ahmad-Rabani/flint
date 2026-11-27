import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { jsonOk, handleRouteError } from "@/lib/api";
import { listAuditLogs } from "@/features/audit/queries";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApi("audit.view");
    const params = req.nextUrl.searchParams;
    const page = Number(params.get("page") ?? "1");
    const result = await listAuditLogs({
      q: params.get("q") ?? undefined,
      action: params.get("action") ?? undefined,
      entityType: params.get("entityType") ?? undefined,
      page: Number.isFinite(page) ? page : 1,
    });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
