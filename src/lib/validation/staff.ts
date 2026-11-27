import { z } from "zod";
import { PERMISSIONS } from "@/constants";
import { STAFF_ROLE_KEYS } from "@/lib/auth/roles";

export const staffRoleSchema = z.enum(STAFF_ROLE_KEYS);

export const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  role: staffRoleSchema,
  isActive: z.boolean().optional(),
  customPermissions: z.boolean().optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
});

export const updateStaffSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: staffRoleSchema.optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(200).optional().or(z.literal("")),
  customPermissions: z.boolean().optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  deletedAt: z.literal(true).optional(),
});

export const updateRoleSchema = z.object({
  permissions: z.array(z.enum(PERMISSIONS)),
  description: z.string().trim().max(400).optional(),
});
