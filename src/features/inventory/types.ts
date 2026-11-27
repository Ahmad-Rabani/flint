import type { InventoryMovementType } from "@/constants";

export const STOCK_FILTERS = ["all", "low", "out", "in"] as const;
export type StockFilter = (typeof STOCK_FILTERS)[number];

export const ADJUSTABLE_MOVEMENT_TYPES = [
  "adjustment",
  "purchase",
  "damage",
  "transfer",
  "return",
] as const;

export type AdjustableMovementType = (typeof ADJUSTABLE_MOVEMENT_TYPES)[number];

export type StockStatus = "out" | "low" | "in";

export const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  purchase: "Purchase",
  sale_online: "Online sale",
  sale_pos: "POS sale",
  adjustment: "Adjustment",
  return: "Return",
  refund: "Refund",
  damage: "Damage",
  transfer: "Transfer",
};

export function movementTypeLabel(type: string) {
  return MOVEMENT_TYPE_LABELS[type as InventoryMovementType] ?? type.replace(/_/g, " ");
}

export function stockStatus(stock: number, minStockLevel: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= minStockLevel) return "low";
  return "in";
}

export function parseStockFilter(value?: string): StockFilter {
  if (value === "low" || value === "out" || value === "in") return value;
  return "all";
}

export type InventoryVariantOption = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  stock: number;
};

export type InventoryProductOption = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  stock: number;
  minStockLevel: number;
  costPrice: number;
  price: number;
  imageUrl: string | null;
  variants: InventoryVariantOption[];
};

export type InventoryOverviewItem = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  stock: number;
  minStockLevel: number;
  costPrice: number;
  price: number;
  valuation: number;
  imageUrl: string | null;
  tracksVariants: boolean;
  variantCount: number;
  stockStatus: StockStatus;
};

export type InventoryStats = {
  skuCount: number;
  unitsOnHand: number;
  valuation: number;
  critical: number;
};

export type StockAlertCounts = {
  all: number;
  low: number;
  out: number;
  in: number;
};

export type InventoryMovementRow = {
  id: string;
  createdAt: string;
  sku: string;
  productId: string | null;
  productName: string;
  type: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string | null;
  notes: string | null;
  referenceType: string | null;
  referenceId: string | null;
  performedBy: string | null;
};

export type AdjustStockResult = {
  movementId: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  sku: string;
  type: AdjustableMovementType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  clamped: boolean;
  reason: string | null;
};
