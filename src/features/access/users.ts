import "server-only";

import { connectToDatabase } from "@/lib/mongodb/connection";
import { sanitizePermissions } from "@/lib/permissions";
import { User } from "@/models/User";

export type StaffUserDto = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string | null;
};

function iso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toDto(doc: {
  _id: unknown;
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  permissions?: string[];
  lastLoginAt?: unknown;
  createdAt?: unknown;
}): StaffUserDto {
  return {
    id: String(doc._id),
    name: doc.name ?? "",
    email: doc.email ?? "",
    role: doc.role ?? "",
    isActive: doc.isActive !== false,
    permissions: sanitizePermissions(doc.permissions),
    lastLoginAt: iso(doc.lastLoginAt),
    createdAt: iso(doc.createdAt),
  };
}

export async function listStaffUsers(q?: string): Promise<StaffUserDto[]> {
  await connectToDatabase();
  const filter: Record<string, unknown> = { role: { $ne: "customer" }, deletedAt: null };
  const term = q?.trim().slice(0, 80);
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const docs = await User.find(filter).select("-passwordHash").sort({ name: 1 }).limit(200).lean();
  return docs.map((doc: Parameters<typeof toDto>[0]) => toDto(doc));
}

export async function getStaffUser(id: string): Promise<StaffUserDto | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectToDatabase();
  const doc = await User.findOne({ _id: id, role: { $ne: "customer" }, deletedAt: null })
    .select("-passwordHash")
    .lean();
  if (!doc) return null;
  return toDto(doc as Parameters<typeof toDto>[0]);
}
