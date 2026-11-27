import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/permissions";
import { jsonOk, handleRouteError } from "@/lib/api";
import { parseReportRange } from "@/features/reports/range";
import { getInventoryReport, getSalesOverview } from "@/features/reports/queries";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminApi("reports.view");
    const range = parseReportRange(req.nextUrl.searchParams.get("from"), req.nextUrl.searchParams.get("to"));
    const [sales, inventory] = await Promise.all([getSalesOverview(range), getInventoryReport()]);
    const financial = hasPermission(session, "reports.financial");
    return jsonOk({
      range: { from: range.fromInput, to: range.toInput },
      sales,
      inventory: {
        skuCount: inventory.skuCount,
        retailValue: inventory.retailValue,
        lowStockCount: inventory.lowStockCount,
        outOfStockCount: inventory.outOfStockCount,
        ...(financial ? { stockValue: inventory.stockValue } : {}),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
