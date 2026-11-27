import "server-only";

import { connectToDatabase } from "@/lib/mongodb/connection";
import { AuditLog } from "@/models/AuditLog";

export type AuditLogRow = {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
};

export type AuditLogPage = {
  items: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  actions: string[];
  entityTypes: string[];
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function iso(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export async function listAuditLogs(input: {
  q?: string;
  action?: string;
  entityType?: string;
  page?: number;
}): Promise<AuditLogPage> {
  await connectToDatabase();
  const pageSize = 30;
  const requested = Number.isFinite(input.page) && (input.page ?? 0) > 0 ? Math.floor(input.page as number) : 1;
  const filter: Record<string, unknown> = {};
  const action = input.action?.trim().slice(0, 80);
  const entityType = input.entityType?.trim().slice(0, 80);
  const term = input.q?.trim().slice(0, 80);
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ actorEmail: rx }, { summary: rx }];
  }

  const [total, actions, entityTypes] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.distinct("action"),
    AuditLog.distinct("entityType"),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const docs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return {
    items: docs.map((doc) => ({
      id: String(doc._id),
      createdAt: iso(doc.createdAt),
      actorEmail: doc.actorEmail || "System",
      action: doc.action,
      entityType: doc.entityType,
      entityId: doc.entityId ? String(doc.entityId) : "",
      summary: doc.summary || "",
    })),
    total,
    page,
    pageSize,
    totalPages,
    actions: actions.map(String).filter(Boolean).sort(),
    entityTypes: entityTypes.map(String).filter(Boolean).sort(),
  };
}
