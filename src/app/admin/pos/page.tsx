export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { hasPermission } from "@/lib/permissions";
import { loadPosTerminal } from "@/features/pos/queries";
import { PosTerminal } from "@/features/pos/components/pos-terminal";

export default async function AdminPOSPage() {
  const session = await requireAdminSession("pos.access");
  await connection();
  const data = await loadPosTerminal({
    cashierName: session.name,
    canDiscount: hasPermission(session, "pos.discount"),
  });

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <PosTerminal data={data} />
    </div>
  );
}
