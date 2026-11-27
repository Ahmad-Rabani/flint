import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { handleRouteError, jsonOk } from "@/lib/api";
import { refundPosSale } from "@/features/pos/service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminApi("pos.refund");
    const { id } = await params;
    const result = await refundPosSale(id, session);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
