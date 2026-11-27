import "server-only";

import { Types } from "mongoose";
import type { PaymentMethod } from "@/constants";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { BusinessSettings } from "@/models/BusinessSettings";
import { Category } from "@/models/Category";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { POSTransaction } from "@/models/POSTransaction";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import {
  formatBusinessAddress,
  inferTaxInclusive,
  normalizeTaxRate,
  PAYMENT_LABELS,
  resolvePaymentMethods,
} from "@/features/pos/pricing";
import type {
  PosCatalogItem,
  PosCategory,
  PosCustomerHit,
  PosReceipt,
  PosSaleRow,
  PosTerminalData,
} from "@/features/pos/types";

type VariantRow = {
  _id?: unknown;
  name?: string;
  sku?: string;
  barcode?: string | null;
  price?: number;
  stock?: number | null;
  isActive?: boolean;
};

type ProductRow = {
  _id: unknown;
  name: string;
  sku: string;
  barcode?: string | null;
  price: number;
  stock?: number | null;
  minStockLevel?: number;
  ageRestriction?: number;
  images?: { url?: string }[];
  categoryIds?: unknown[];
  variants?: VariantRow[];
};

type SaleLean = {
  _id: unknown;
  receiptNumber: string;
  createdAt?: Date | string;
  status: "completed" | "refunded" | "voided";
  guestName?: string | null;
  paymentMethod: PaymentMethod;
  total: number;
  items?: unknown[];
  customerId?: unknown;
  cashierId?: unknown;
};

type TxItem = {
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  taxRate?: number;
};

type TxLean = {
  _id: unknown;
  receiptNumber: string;
  cashierId?: unknown;
  customerId?: unknown;
  guestName?: string | null;
  items?: TxItem[];
  subtotal: number;
  discountAmount?: number;
  discountReason?: string | null;
  taxAmount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountTendered?: number | null;
  changeGiven?: number | null;
  orderId?: unknown;
  status: "completed" | "refunded" | "voided";
  notes?: string | null;
  createdAt?: Date | string;
};

async function ensureDb() {
  await connectToDatabase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toIso(value: Date | string | undefined) {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function namedRef(value: unknown) {
  if (!value || typeof value !== "object" || !("name" in value)) return null;
  const name = (value as { name?: unknown }).name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function itemCount(items: unknown) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    if (!item || typeof item !== "object" || !("quantity" in item)) return sum;
    const quantity = (item as { quantity?: unknown }).quantity;
    return sum + (typeof quantity === "number" ? quantity : 0);
  }, 0);
}

function addressBlock(
  settings: {
    address?: Parameters<typeof formatBusinessAddress>[0];
    phone?: string | null;
    email?: string | null;
  } | null,
) {
  const address = formatBusinessAddress(settings?.address);
  const contact = [settings?.phone, settings?.email].filter((part) => part && part.trim()).join(" · ");
  const lines = [address, contact || null].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : null;
}

async function readCatalog(): Promise<{ items: PosCatalogItem[]; categories: PosCategory[] }> {
  const [products, categoryDocs] = await Promise.all([
    Product.find({ status: "active", deletedAt: null })
      .select("name sku barcode price stock minStockLevel images categoryIds variants ageRestriction")
      .sort({ name: 1 })
      .limit(500)
      .lean(),
    Category.find({ isActive: true, deletedAt: null }).select("name").sort({ sortOrder: 1, name: 1 }).lean(),
  ]);

  const items: PosCatalogItem[] = [];
  for (const product of products as unknown as ProductRow[]) {
    const productId = String(product._id);
    const imageUrl = product.images?.find((image) => image.url)?.url ?? null;
    const categoryIds = (product.categoryIds ?? []).map((id) => String(id)).filter(Boolean);
    const minStockLevel = product.minStockLevel ?? 5;
    const ageRestriction = product.ageRestriction ?? 0;
    const variants = product.variants ?? [];

    if (variants.length > 0) {
      for (const variant of variants) {
        if (variant.isActive === false || !variant.sku) continue;
        const variantId = String(variant._id);
        const variantName = variant.name?.trim() || "Variant";
        items.push({
          key: `${productId}:${variantId}`,
          productId,
          variantId,
          name: product.name,
          variantName,
          displayName: `${product.name} — ${variantName}`,
          sku: variant.sku,
          barcode: variant.barcode?.trim() || product.barcode?.trim() || null,
          price: variant.price ?? product.price,
          stock: variant.stock ?? 0,
          minStockLevel,
          imageUrl,
          categoryIds,
          ageRestriction,
        });
      }
      continue;
    }

    items.push({
      key: `${productId}:`,
      productId,
      variantId: null,
      name: product.name,
      variantName: null,
      displayName: product.name,
      sku: product.sku,
      barcode: product.barcode?.trim() || null,
      price: product.price,
      stock: product.stock ?? 0,
      minStockLevel,
      imageUrl,
      categoryIds,
      ageRestriction,
    });
  }

  items.sort((a, b) => a.displayName.localeCompare(b.displayName));
  const used = new Set(items.flatMap((item) => item.categoryIds));
  const categories = (categoryDocs as unknown as { _id: unknown; name: string }[])
    .map((category) => ({ id: String(category._id), name: category.name }))
    .filter((category) => used.has(category.id));

  return { items, categories };
}

export async function listPosCatalog() {
  await ensureDb();
  return readCatalog();
}

export async function loadPosTerminal(input: {
  cashierName: string;
  canDiscount: boolean;
}): Promise<PosTerminalData> {
  await ensureDb();
  const [catalog, settings] = await Promise.all([
    readCatalog(),
    BusinessSettings.findOne({ key: "default" }).lean(),
  ]);

  return {
    ...catalog,
    paymentMethods: resolvePaymentMethods(settings?.paymentMethods),
    taxRate: settings?.taxRate ?? 0,
    taxInclusive: Boolean(settings?.taxInclusive),
    currency: settings?.currency || "USD",
    businessName: settings?.businessName || "FLINT",
    businessAddress: addressBlock(settings),
    cashierName: input.cashierName,
    canDiscount: input.canDiscount,
  };
}

export async function searchPosCustomers(q: string): Promise<PosCustomerHit[]> {
  await ensureDb();
  const term = q.trim().slice(0, 80);
  if (!term) return [];
  const rx = new RegExp(escapeRegex(term), "i");
  const docs = await Customer.find({
    deletedAt: null,
    $or: [{ name: rx }, { email: rx }, { phone: rx }],
  })
    .select("name email phone")
    .sort({ name: 1 })
    .limit(8)
    .lean();

  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? null,
  }));
}

export async function listPosSales(input: {
  page?: number;
  pageSize?: number;
  status?: "completed" | "refunded" | "voided" | "all";
  q?: string;
}) {
  await ensureDb();
  const pageSize = input.pageSize ?? 30;
  const page = Number.isFinite(input.page) && (input.page ?? 0) > 0 ? Math.floor(input.page as number) : 1;
  const filter: Record<string, unknown> = {};
  if (input.status && input.status !== "all") filter.status = input.status;
  const q = input.q?.trim().slice(0, 80);
  if (q) filter.receiptNumber = new RegExp(escapeRegex(q), "i");

  const [docs, total, settings] = await Promise.all([
    POSTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("customerId", "name")
      .populate("cashierId", "name")
      .lean(),
    POSTransaction.countDocuments(filter),
    BusinessSettings.findOne({ key: "default" }).select("currency").lean(),
  ]);

  const items: PosSaleRow[] = (docs as unknown as SaleLean[]).map((doc) => ({
    id: String(doc._id),
    receiptNumber: doc.receiptNumber,
    createdAt: toIso(doc.createdAt),
    status: doc.status,
    customerName: namedRef(doc.customerId) || doc.guestName?.trim() || "Walk-in Guest",
    cashierName: namedRef(doc.cashierId) || "Staff",
    paymentMethod: doc.paymentMethod,
    total: doc.total,
    itemCount: itemCount(doc.items),
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    currency: settings?.currency || "USD",
  };
}

export async function getPosReceipt(id: string): Promise<PosReceipt | null> {
  await ensureDb();
  if (!Types.ObjectId.isValid(id)) return null;

  const tx = (await POSTransaction.findById(id).lean()) as TxLean | null;
  if (!tx) return null;

  const settings = await BusinessSettings.findOne({ key: "default" }).lean();
  const methods = resolvePaymentMethods(settings?.paymentMethods);

  let cashierName = "Staff";
  if (tx.cashierId && Types.ObjectId.isValid(String(tx.cashierId))) {
    const user = await User.findById(tx.cashierId).select("name").lean();
    if (user && typeof user.name === "string" && user.name.trim()) cashierName = user.name;
  }

  let customerName = tx.guestName?.trim() || "Walk-in Guest";
  if (tx.customerId && Types.ObjectId.isValid(String(tx.customerId))) {
    const customer = await Customer.findById(tx.customerId).select("name").lean();
    if (customer?.name) customerName = customer.name;
  }

  let orderNumber: string | null = null;
  let currency = settings?.currency || "USD";
  if (tx.orderId && Types.ObjectId.isValid(String(tx.orderId))) {
    const order = await Order.findById(tx.orderId).select("orderNumber currency").lean();
    if (order?.orderNumber) orderNumber = String(order.orderNumber);
    if (order?.currency) currency = String(order.currency);
  }

  const items = (tx.items ?? []).map((item) => ({
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }));
  const storedRate = tx.items?.find((item) => typeof item.taxRate === "number")?.taxRate;
  const subtotal = tx.subtotal;
  const discountAmount = tx.discountAmount ?? 0;
  const taxAmount = tx.taxAmount ?? 0;

  return {
    id: String(tx._id),
    receiptNumber: tx.receiptNumber,
    orderId: tx.orderId ? String(tx.orderId) : null,
    orderNumber,
    status: tx.status,
    createdAt: toIso(tx.createdAt),
    businessName: settings?.businessName || "FLINT",
    businessAddress: addressBlock(settings),
    currency,
    cashierName,
    customerName,
    items,
    subtotal,
    discountAmount,
    discountReason: tx.discountReason?.trim() || null,
    taxAmount,
    taxRate: storedRate ?? normalizeTaxRate(settings?.taxRate ?? 0),
    taxInclusive: inferTaxInclusive(subtotal, discountAmount, taxAmount, tx.total),
    total: tx.total,
    paymentMethod: tx.paymentMethod,
    paymentLabel:
      methods.find((method) => method.id === tx.paymentMethod)?.label ?? PAYMENT_LABELS[tx.paymentMethod],
    amountTendered: tx.amountTendered == null ? null : tx.amountTendered,
    changeGiven: tx.changeGiven == null ? null : tx.changeGiven,
    notes: tx.notes?.trim() || null,
  };
}
