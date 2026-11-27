import "server-only";

import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { InventoryMovement } from "@/models/InventoryMovement";
import { Product } from "@/models/Product";
import {
  ADJUSTABLE_MOVEMENT_TYPES,
  type AdjustableMovementType,
  type AdjustStockResult,
} from "@/features/inventory/types";

const REFERENCE_TYPES = ["order", "pos", "adjustment", "return", "custom"] as const;
type ReferenceType = (typeof REFERENCE_TYPES)[number];

export type AdjustStockInput = {
  productId: string;
  variantId?: string;
  quantityChange: number;
  type: AdjustableMovementType;
  reason?: string;
  notes?: string;
  performedBy: string;
  referenceType?: ReferenceType;
  referenceId?: string;
  /** Damage write-offs only: if the deduction exceeds on-hand stock, reduce it to zero. */
  allowZeroWriteOff?: boolean;
};

type VariantStock = {
  _id?: unknown;
  name?: string;
  sku?: string;
  stock?: number | null;
};

type StockRecord = {
  name?: string;
  sku?: string;
  stock?: number | null;
  variants?: VariantStock[] | null;
};

type AppliedChange = {
  sku: string;
  before: number;
  after: number;
  appliedChange: number;
  clamped: boolean;
};

const ID_PATTERN = /^[a-f\d]{24}$/i;

function parseId(id: string, label: string) {
  if (!ID_PATTERN.test(id)) throw new Error(`Invalid ${label}`);
  return new Types.ObjectId(id);
}

function readVariant(doc: StockRecord, variantId: string) {
  const variant = doc.variants?.find((item) => String(item._id) === variantId);
  if (!variant) throw new Error("Variant not found on this product");
  return variant;
}

function stockError(onHand: number, type: AdjustableMovementType, allowClamp: boolean) {
  if (onHand <= 0) return "Already out of stock. Nothing to remove.";
  if (allowClamp) return "Could not write off stock. Refresh the product and try again.";
  if (type === "damage") {
    return `Only ${onHand} on hand. Enable zeroing the remaining stock to write off what is left.`;
  }
  return `Only ${onHand} on hand. That change would take stock below zero.`;
}

async function explainStockFailure(
  productId: Types.ObjectId,
  variantId: Types.ObjectId | undefined,
  type: AdjustableMovementType,
  allowClamp: boolean,
): Promise<never> {
  const fresh = (await Product.findOne({ _id: productId, deletedAt: null })
    .select("stock variants")
    .lean()) as StockRecord | null;
  if (!fresh) throw new Error("Product not found");

  if (variantId) {
    const variant = fresh.variants?.find((item) => String(item._id) === String(variantId));
    if (!variant) throw new Error("Variant not found on this product");
    throw new Error(stockError(variant.stock ?? 0, type, allowClamp));
  }

  throw new Error(stockError(fresh.stock ?? 0, type, allowClamp));
}

async function changeStock(args: {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantityChange: number;
  allowClamp: boolean;
  type: AdjustableMovementType;
}): Promise<AppliedChange> {
  const { productId, variantId, quantityChange, allowClamp, type } = args;
  const variantKey = variantId ? String(variantId) : undefined;

  if (quantityChange > 0) {
    const updated = (await Product.findOneAndUpdate(
      variantId
        ? { _id: productId, deletedAt: null, "variants._id": variantId }
        : { _id: productId, deletedAt: null },
      variantId ? { $inc: { "variants.$.stock": quantityChange } } : { $inc: { stock: quantityChange } },
      { returnDocument: "after" },
    )) as StockRecord | null;

    if (!updated) {
      throw new Error(variantId ? "Variant not found on this product" : "Product not found");
    }

    if (variantKey) {
      const variant = readVariant(updated, variantKey);
      const after = variant.stock ?? 0;
      return {
        sku: variant.sku || updated.sku || "",
        before: after - quantityChange,
        after,
        appliedChange: quantityChange,
        clamped: false,
      };
    }

    const after = updated.stock ?? 0;
    return {
      sku: updated.sku || "",
      before: after - quantityChange,
      after,
      appliedChange: quantityChange,
      clamped: false,
    };
  }

  const abs = Math.abs(quantityChange);
  const exact = (await Product.findOneAndUpdate(
    variantId
      ? {
          _id: productId,
          deletedAt: null,
          variants: { $elemMatch: { _id: variantId, stock: { $gte: abs } } },
        }
      : { _id: productId, deletedAt: null, stock: { $gte: abs } },
    variantId ? { $inc: { "variants.$.stock": quantityChange } } : { $inc: { stock: quantityChange } },
    { returnDocument: "after" },
  )) as StockRecord | null;

  if (exact) {
    if (variantKey) {
      const variant = readVariant(exact, variantKey);
      const after = variant.stock ?? 0;
      return {
        sku: variant.sku || exact.sku || "",
        before: after - quantityChange,
        after,
        appliedChange: quantityChange,
        clamped: false,
      };
    }
    const after = exact.stock ?? 0;
    return {
      sku: exact.sku || "",
      before: after - quantityChange,
      after,
      appliedChange: quantityChange,
      clamped: false,
    };
  }

  if (allowClamp) {
    const previous = (await Product.findOneAndUpdate(
      variantId
        ? {
            _id: productId,
            deletedAt: null,
            variants: { $elemMatch: { _id: variantId, stock: { $gt: 0, $lt: abs } } },
          }
        : { _id: productId, deletedAt: null, stock: { $gt: 0, $lt: abs } },
      variantId ? { $set: { "variants.$.stock": 0 } } : { $set: { stock: 0 } },
      { returnDocument: "before" },
    )) as StockRecord | null;

    if (previous) {
      if (variantKey) {
        const variant = readVariant(previous, variantKey);
        const before = variant.stock ?? 0;
        return {
          sku: variant.sku || previous.sku || "",
          before,
          after: 0,
          appliedChange: -before,
          clamped: true,
        };
      }
      const before = previous.stock ?? 0;
      return {
        sku: previous.sku || "",
        before,
        after: 0,
        appliedChange: -before,
        clamped: true,
      };
    }
  }

  return explainStockFailure(productId, variantId, type, allowClamp);
}

async function revertStock(args: {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  applied: AppliedChange;
}) {
  const { productId, variantId, applied } = args;
  if (variantId) {
    if (applied.clamped) {
      await Product.updateOne(
        { _id: productId, variants: { $elemMatch: { _id: variantId, stock: 0 } } },
        { $set: { "variants.$.stock": applied.before } },
      );
      return;
    }
    await Product.updateOne(
      { _id: productId, "variants._id": variantId },
      { $inc: { "variants.$.stock": -applied.appliedChange } },
    );
    return;
  }

  if (applied.clamped) {
    await Product.updateOne({ _id: productId, stock: 0 }, { $set: { stock: applied.before } });
    return;
  }
  await Product.updateOne({ _id: productId }, { $inc: { stock: -applied.appliedChange } });
}

export async function adjustStock(input: AdjustStockInput): Promise<AdjustStockResult> {
  if (!(ADJUSTABLE_MOVEMENT_TYPES as readonly string[]).includes(input.type)) {
    throw new Error("This movement type cannot be posted manually");
  }
  if (!Number.isInteger(input.quantityChange) || input.quantityChange === 0) {
    throw new Error("Enter a non-zero whole number");
  }
  if (Math.abs(input.quantityChange) > 1_000_000) {
    throw new Error("Quantity is too large");
  }

  const productId = parseId(input.productId, "product");
  const variantId = input.variantId ? parseId(input.variantId, "variant") : undefined;
  const performedBy = parseId(input.performedBy, "user");
  const referenceType = input.referenceType ?? (input.type === "return" ? "return" : "adjustment");
  if (!(REFERENCE_TYPES as readonly string[]).includes(referenceType)) {
    throw new Error("Invalid reference type");
  }
  const referenceId = input.referenceId ? parseId(input.referenceId, "reference") : undefined;
  const allowClamp =
    input.type === "damage" && input.quantityChange < 0 && input.allowZeroWriteOff === true;

  await connectToDatabase();

  const snapshot = (await Product.findOne({ _id: productId, deletedAt: null })
    .select("name sku variants")
    .lean()) as (StockRecord & { variants?: VariantStock[] | null }) | null;
  if (!snapshot) throw new Error("Product not found");

  const variants = snapshot.variants ?? [];
  if (variants.length > 0 && !variantId) {
    throw new Error("Choose a variant. This product tracks stock per variant.");
  }
  if (variantId && variants.length === 0) {
    throw new Error("This product has no variants");
  }
  const variantMeta = variantId
    ? variants.find((item) => String(item._id) === String(variantId))
    : undefined;
  if (variantId && !variantMeta) throw new Error("Variant not found on this product");

  const applied = await changeStock({
    productId,
    variantId,
    quantityChange: input.quantityChange,
    allowClamp,
    type: input.type,
  });

  const reason = input.reason?.trim() || undefined;
  const notes = [
    input.notes?.trim(),
    applied.clamped
      ? `Requested ${input.quantityChange}; wrote off remaining stock to zero.`
      : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const movement = await InventoryMovement.create({
      productId,
      variantId,
      sku: applied.sku || snapshot.sku || variantMeta?.sku || "SKU",
      type: input.type,
      quantityChange: applied.appliedChange,
      quantityBefore: applied.before,
      quantityAfter: applied.after,
      reason,
      notes: notes || undefined,
      referenceType,
      referenceId,
      performedBy,
    });

    return {
      movementId: String(movement._id),
      productId: String(productId),
      productName: snapshot.name || "Product",
      variantId: variantId ? String(variantId) : null,
      variantName: variantMeta?.name ?? null,
      sku: applied.sku || snapshot.sku || "",
      type: input.type,
      quantityChange: applied.appliedChange,
      quantityBefore: applied.before,
      quantityAfter: applied.after,
      clamped: applied.clamped,
      reason: reason ?? null,
    };
  } catch (error) {
    try {
      await revertStock({ productId, variantId, applied });
    } catch {
      throw new Error("Stock changed but the movement log failed. Check this SKU before trying again.");
    }
    const detail = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Stock change was rolled back. ${detail}`);
  }
}
