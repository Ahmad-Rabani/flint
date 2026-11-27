import { connectToDatabase } from "@/lib/mongodb/connection";
import { AuditLog } from "@/models";
import type { SessionUser } from "@/types";

export async function writeAuditLog(params: {
  actor?: SessionUser | null;
  action: string;
  entityType: string;
  entityId?: string;
  summary?: string;
  changes?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  await connectToDatabase();
  await AuditLog.create({
    actorId: params.actor?.id,
    actorEmail: params.actor?.email,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    summary: params.summary,
    changes: params.changes,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}
