import { z } from "zod";

const mediaRefSchema = z.object({
  key: z.string().min(1),
  url: z.string().min(1),
  alt: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.number().optional(),
});

export const customOrderSchema = z.object({
  productType: z.enum(["knife", "axe", "utility"] as const),
  designStyle: z.string().min(1, "Design style is required"),
  preferences: z.record(z.string(), z.string()).optional(),
  referenceImages: z.array(mediaRefSchema).max(8).optional(),
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().optional(),
  description: z
    .string()
    .min(10, "Please describe your vision in at least 10 characters")
    .max(2000),
  intendedUse: z.string().max(500).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  preferredDeliveryDate: z.string().optional(),
  additionalComments: z.string().max(1000).optional(),
});

export type CustomOrderInput = z.infer<typeof customOrderSchema>;
