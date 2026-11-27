import "server-only";
import { connection } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CustomOrder, CustomizationOption, Quotation } from "@/models";
import type { SessionUser } from "@/types";

// ─── Customization Options ────────────────────────────────────────────────────

export type PlainOptionValue = {
  id: string;
  label: string;
  value: string;
  priceDelta: number;
  isDefault: boolean;
  isActive: boolean;
  image?: { key: string; url: string; alt?: string };
};

export type PlainCustomizationOption = {
  id: string;
  key: string;
  name: string;
  description?: string;
  productTypes: string[];
  inputType: string;
  isRequired: boolean;
  sortOrder: number;
  values: PlainOptionValue[];
};

export async function getCustomizationOptions(
  productType?: string,
): Promise<PlainCustomizationOption[]> {
  await connection();
  await connectToDatabase();

  const filter: Record<string, unknown> = { isActive: true, deletedAt: null };
  if (productType) {
    filter.productTypes = productType;
  }

  const options = await CustomizationOption.find(filter).sort({ sortOrder: 1 }).lean();

  return options.map((opt) => ({
    id: String(opt._id),
    key: opt.key,
    name: opt.name,
    description: opt.description ?? undefined,
    productTypes: (opt.productTypes as string[]) ?? [],
    inputType: opt.inputType ?? "select",
    isRequired: opt.isRequired ?? false,
    sortOrder: opt.sortOrder ?? 0,
    values: ((opt.values as unknown as Array<Record<string, unknown>>) ?? [])
      .filter((v) => v.isActive !== false)
      .map((v) => ({
        id: String(v._id),
        label: String(v.label ?? ""),
        value: String(v.value ?? ""),
        priceDelta: Number(v.priceDelta ?? 0),
        isDefault: Boolean(v.isDefault),
        isActive: v.isActive !== false,
        image:
          v.image && typeof v.image === "object"
            ? {
                key: String((v.image as Record<string, unknown>).key ?? ""),
                url: String((v.image as Record<string, unknown>).url ?? ""),
                alt: (v.image as Record<string, unknown>).alt
                  ? String((v.image as Record<string, unknown>).alt)
                  : undefined,
              }
            : undefined,
      })),
  }));
}

// ─── Customer Custom Orders ───────────────────────────────────────────────────

export type PlainCustomOrderListItem = {
  id: string;
  orderNumber: string;
  productType: string;
  designStyle: string;
  status: string;
  createdAt: string;
  hasQuotation: boolean;
};

export type PlainCustomOrderDetail = PlainCustomOrderListItem & {
  preferences: Record<string, string>;
  referenceImages: Array<{ key: string; url: string; alt?: string }>;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  intendedUse?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredDeliveryDate?: string;
  additionalComments?: string;
  statusHistory: Array<{ status: string; note?: string; createdAt: string }>;
  quotation?: {
    id: string;
    quotationNumber: string;
    amount: number;
    currency: string;
    message?: string;
    validUntil?: string;
    status: string;
    sentAt?: string;
    depositAmount?: number;
    estimatedDays?: number;
  } | null;
};

export async function getCustomerCustomOrders(
  session: SessionUser,
): Promise<PlainCustomOrderListItem[]> {
  await connection();
  await connectToDatabase();

  const filter = session.customerId
    ? { customerId: session.customerId, deletedAt: null }
    : { customerEmail: session.email.toLowerCase(), deletedAt: null };

  const orders = await CustomOrder.find(filter).sort({ createdAt: -1 }).lean();

  return orders.map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    productType: o.productType,
    designStyle: o.designStyle,
    status: o.status,
    createdAt: o.createdAt ? new Date(String(o.createdAt)).toISOString() : "",
    hasQuotation: Boolean(o.quotationId),
  }));
}

export async function getCustomOrderByNumber(
  session: SessionUser,
  number: string,
): Promise<PlainCustomOrderDetail | null> {
  await connection();
  await connectToDatabase();

  const filter = session.customerId
    ? { orderNumber: number, customerId: session.customerId, deletedAt: null }
    : { orderNumber: number, customerEmail: session.email.toLowerCase(), deletedAt: null };

  const order = await CustomOrder.findOne(filter).lean();
  if (!order) return null;

  let quotation: PlainCustomOrderDetail["quotation"] = null;
  if (order.quotationId) {
    const q = await Quotation.findById(order.quotationId).lean();
    if (q) {
      quotation = {
        id: String(q._id),
        quotationNumber: q.quotationNumber,
        amount: q.amount,
        currency: q.currency ?? "USD",
        message: q.message ?? undefined,
        validUntil: q.validUntil ? new Date(String(q.validUntil)).toISOString() : undefined,
        status: q.status,
        sentAt: q.sentAt ? new Date(String(q.sentAt)).toISOString() : undefined,
        depositAmount: q.depositAmount ?? 0,
        estimatedDays: q.estimatedDays ?? undefined,
      };
    }
  }

  const prefsRaw = order.preferences as Map<string, string> | undefined;
  const preferences: Record<string, string> = {};
  if (prefsRaw instanceof Map) {
    for (const [k, v] of prefsRaw.entries()) {
      preferences[k] = v;
    }
  } else if (prefsRaw && typeof prefsRaw === "object") {
    Object.assign(preferences, prefsRaw);
  }

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    productType: order.productType,
    designStyle: order.designStyle,
    preferences,
    referenceImages: ((order.referenceImages as unknown as Array<Record<string, unknown>>) ?? []).map(
      (img) => ({
        key: String(img.key ?? ""),
        url: String(img.url ?? ""),
        alt: img.alt ? String(img.alt) : undefined,
      }),
    ),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone ?? undefined,
    description: order.description,
    intendedUse: order.intendedUse ?? undefined,
    budgetMin: order.budgetMin ?? undefined,
    budgetMax: order.budgetMax ?? undefined,
    preferredDeliveryDate: order.preferredDeliveryDate
      ? new Date(String(order.preferredDeliveryDate)).toISOString()
      : undefined,
    additionalComments: order.additionalComments ?? undefined,
    status: order.status,
    hasQuotation: Boolean(order.quotationId),
    statusHistory: ((order.statusHistory as unknown as Array<Record<string, unknown>>) ?? []).map((h) => ({
      status: String(h.status ?? ""),
      note: h.note ? String(h.note) : undefined,
      createdAt: h.createdAt ? new Date(String(h.createdAt)).toISOString() : "",
    })),
    createdAt: order.createdAt ? new Date(String(order.createdAt)).toISOString() : "",
    quotation,
  };
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export type AdminCustomOrderListItem = {
  id: string;
  orderNumber: string;
  productType: string;
  designStyle: string;
  status: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  hasQuotation: boolean;
};

export async function getAllCustomOrders(): Promise<AdminCustomOrderListItem[]> {
  await connection();
  await connectToDatabase();

  const orders = await CustomOrder.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();

  return orders.map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    productType: o.productType,
    designStyle: o.designStyle,
    status: o.status,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    createdAt: o.createdAt ? new Date(String(o.createdAt)).toISOString() : "",
    hasQuotation: Boolean(o.quotationId),
  }));
}

export async function getAdminCustomOrderById(id: string): Promise<PlainCustomOrderDetail | null> {
  await connection();
  await connectToDatabase();

  const order = await CustomOrder.findOne({ _id: id, deletedAt: null }).lean();
  if (!order) return null;

  let quotation: PlainCustomOrderDetail["quotation"] = null;
  if (order.quotationId) {
    const q = await Quotation.findById(order.quotationId).lean();
    if (q) {
      quotation = {
        id: String(q._id),
        quotationNumber: q.quotationNumber,
        amount: q.amount,
        currency: q.currency ?? "USD",
        message: q.message ?? undefined,
        validUntil: q.validUntil ? new Date(String(q.validUntil)).toISOString() : undefined,
        status: q.status,
        sentAt: q.sentAt ? new Date(String(q.sentAt)).toISOString() : undefined,
        depositAmount: q.depositAmount ?? 0,
        estimatedDays: q.estimatedDays ?? undefined,
      };
    }
  }

  const prefsRaw = order.preferences as Map<string, string> | undefined;
  const preferences: Record<string, string> = {};
  if (prefsRaw instanceof Map) {
    for (const [k, v] of prefsRaw.entries()) {
      preferences[k] = v;
    }
  } else if (prefsRaw && typeof prefsRaw === "object") {
    Object.assign(preferences, prefsRaw);
  }

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    productType: order.productType,
    designStyle: order.designStyle,
    preferences,
    referenceImages: ((order.referenceImages as unknown as Array<Record<string, unknown>>) ?? []).map(
      (img) => ({
        key: String(img.key ?? ""),
        url: String(img.url ?? ""),
        alt: img.alt ? String(img.alt) : undefined,
      }),
    ),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone ?? undefined,
    description: order.description,
    intendedUse: order.intendedUse ?? undefined,
    budgetMin: order.budgetMin ?? undefined,
    budgetMax: order.budgetMax ?? undefined,
    preferredDeliveryDate: order.preferredDeliveryDate
      ? new Date(String(order.preferredDeliveryDate)).toISOString()
      : undefined,
    additionalComments: order.additionalComments ?? undefined,
    status: order.status,
    hasQuotation: Boolean(order.quotationId),
    statusHistory: ((order.statusHistory as unknown as Array<Record<string, unknown>>) ?? []).map((h) => ({
      status: String(h.status ?? ""),
      note: h.note ? String(h.note) : undefined,
      createdAt: h.createdAt ? new Date(String(h.createdAt)).toISOString() : "",
    })),
    createdAt: order.createdAt ? new Date(String(order.createdAt)).toISOString() : "",
    quotation,
  };
}
