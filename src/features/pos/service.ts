import "server-only";

import { Types } from "mongoose";
import { hasPermission } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/auth/audit";
import { orderNumber, paymentNumber, receiptNumber } from "@/lib/ids";
import { connectToDatabase } from "@/lib/mongodb/connection";
import {
  BusinessSettings,
  Customer,
  InventoryMovement,
  Order,
  POSTransaction,
  Payment,
  Product,
} from "@/models";
import type { SessionUser } from "@/types";
import {
  formatBusinessAddress,
  PAYMENT_LABELS,
  quotePosTotals,
  resolvePaymentMethods,
  roundMoney,
} from "@/features/pos/pricing";
import type { PosCheckoutInput, PosCheckoutResult, PosReceipt } from "@/features/pos/types";

type VariantRow = {
  _id?: unknown;
  name?: string;
  sku?: string;
  price?: number;
  stock?: number | null;
  isActive?: boolean;
};

type ProductRow = {
  _id: Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  stock?: number | null;
  images?: { url?: string }[];
  variants?: VariantRow[];
};

type PricedLine = {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  sku: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type AppliedDeduction = {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantity: number;
  movementId: Types.ObjectId;
  stockAfter: number;
};

type StockSnapshot = {
  stock?: number | null;
  variants?: { _id?: unknown; stock?: number | null }[] | null;
};

type RestoredLine = {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantity: number;
  movementId: Types.ObjectId;
  soldAdjusted: boolean;
};

function cleanText(value: string | null | undefined, max: number) {
  const text = value?.trim();
  if (!text) return undefined;
  return text.slice(0, max);
}

async function restoreQuantity(
  productId: Types.ObjectId,
  variantId: Types.ObjectId | undefined,
  quantity: number,
) {
  if (variantId) {
    await Product.updateOne(
      { _id: productId, "variants._id": variantId },
      { $inc: { "variants.$.stock": quantity, soldCount: -quantity } },
    );
    return;
  }
  await Product.updateOne({ _id: productId }, { $inc: { stock: quantity, soldCount: -quantity } });
}

async function deductLine(args: {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantity: number;
  sku: string;
  name: string;
  posId: Types.ObjectId;
  cashierId: Types.ObjectId;
  receiptNo: string;
}): Promise<{ movementId: Types.ObjectId; stockAfter: number }> {
  const updated = (await Product.findOneAndUpdate(
    args.variantId
      ? {
          _id: args.productId,
          deletedAt: null,
          variants: { $elemMatch: { _id: args.variantId, stock: { $gte: args.quantity } } },
        }
      : { _id: args.productId, deletedAt: null, stock: { $gte: args.quantity } },
    args.variantId
      ? { $inc: { "variants.$.stock": -args.quantity, soldCount: args.quantity } }
      : { $inc: { stock: -args.quantity, soldCount: args.quantity } },
    { returnDocument: "after" },
  ).lean()) as StockSnapshot | null;

  if (!updated) {
    const stillThere = await Product.exists({ _id: args.productId, deletedAt: null });
    if (!stillThere) throw new Error(`${args.name} is no longer available`);
    throw new Error(`Only a lower quantity of ${args.name} is still on hand`);
  }

  const after = args.variantId
    ? (updated.variants?.find((variant) => String(variant._id) === String(args.variantId))?.stock ?? 0)
    : (updated.stock ?? 0);

  try {
    const movement = await InventoryMovement.create({
      productId: args.productId,
      variantId: args.variantId,
      sku: args.sku,
      type: "sale_pos",
      quantityChange: -args.quantity,
      quantityBefore: after + args.quantity,
      quantityAfter: after,
      reason: "POS sale",
      notes: args.receiptNo,
      referenceType: "pos",
      referenceId: args.posId,
      performedBy: args.cashierId,
    });
    return { movementId: movement._id, stockAfter: after };
  } catch (error) {
    await restoreQuantity(args.productId, args.variantId, args.quantity);
    throw error;
  }
}

async function rollbackDeductions(rows: AppliedDeduction[]) {
  for (const row of [...rows].reverse()) {
    await restoreQuantity(row.productId, row.variantId, row.quantity);
    await InventoryMovement.deleteOne({ _id: row.movementId });
  }
}

export async function checkoutPos(input: PosCheckoutInput, session: SessionUser): Promise<PosCheckoutResult> {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(session.id)) throw new Error("Invalid cashier session");
  const cashierId = new Types.ObjectId(session.id);

  const merged = new Map<string, { productId: string; variantId?: string; quantity: number }>();
  for (const item of input.items) {
    const variantId = item.variantId?.trim() || undefined;
    if (!Types.ObjectId.isValid(item.productId)) throw new Error("Invalid product in the sale");
    if (variantId && !Types.ObjectId.isValid(variantId)) throw new Error("Invalid variant in the sale");
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error("Quantity must be a whole number");
    const key = `${item.productId}:${variantId ?? ""}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += item.quantity;
    else merged.set(key, { productId: item.productId, variantId, quantity: item.quantity });
  }
  if (merged.size === 0) throw new Error("Add at least one product");

  const settings = await BusinessSettings.findOne({ key: "default" }).lean();
  const methods = resolvePaymentMethods(settings?.paymentMethods);
  const paymentOption = methods.find((method) => method.id === input.paymentMethod);
  if (!paymentOption) throw new Error("That payment method is not enabled");

  const priced: PricedLine[] = [];
  for (const line of merged.values()) {
    if (line.quantity > 9999) throw new Error("Quantity is too large");
    const product = (await Product.findOne({
      _id: new Types.ObjectId(line.productId),
      status: "active",
      deletedAt: null,
    }).lean()) as ProductRow | null;
    if (!product) throw new Error("One or more products are unavailable");

    const variants = product.variants ?? [];
    let sku = product.sku;
    let unitPrice = product.price;
    let stock = product.stock ?? 0;
    let name = product.name;
    let variantId: Types.ObjectId | undefined;

    if (variants.length > 0) {
      const variant = variants.find(
        (entry) => line.variantId && String(entry._id) === line.variantId && entry.isActive !== false,
      );
      if (!variant) throw new Error(`Choose an available variant for ${product.name}`);
      sku = variant.sku || product.sku;
      unitPrice = variant.price ?? product.price;
      stock = variant.stock ?? 0;
      name = `${product.name} — ${variant.name || "Variant"}`;
      variantId = new Types.ObjectId(String(variant._id));
    } else if (line.variantId) {
      throw new Error(`Variant unavailable for ${product.name}`);
    }

    if (stock < line.quantity) {
      throw new Error(`Only ${stock} of ${name} are on hand`);
    }

    priced.push({
      productId: product._id,
      variantId,
      sku,
      name,
      imageUrl: product.images?.find((image) => image.url)?.url,
      unitPrice,
      quantity: line.quantity,
      lineTotal: roundMoney(unitPrice * line.quantity),
    });
  }

  const requestedDiscount = roundMoney(Math.max(input.discountAmount ?? 0, 0));
  if (requestedDiscount > 0 && !hasPermission(session, "pos.discount")) {
    throw new Error("You do not have permission to apply a discount");
  }

  const taxInclusive = Boolean(settings?.taxInclusive);
  const quote = quotePosTotals({
    lines: priced,
    discountAmount: requestedDiscount,
    taxRate: settings?.taxRate ?? 0,
    taxInclusive,
  });
  if (requestedDiscount > quote.subtotal) {
    throw new Error("Discount cannot exceed the subtotal");
  }

  let amountTendered: number | undefined;
  let changeGiven: number | undefined;
  if (input.paymentMethod === "cash") {
    if (input.amountTendered == null || !Number.isFinite(input.amountTendered)) {
      throw new Error("Enter the amount tendered");
    }
    amountTendered = roundMoney(input.amountTendered);
    if (amountTendered < quote.total) throw new Error("Amount tendered is less than the total");
    changeGiven = roundMoney(amountTendered - quote.total);
  }

  let customer: { _id: Types.ObjectId; name: string; email: string } | null = null;
  if (input.customerId) {
    if (!Types.ObjectId.isValid(input.customerId)) throw new Error("Invalid customer");
    customer = (await Customer.findOne({ _id: new Types.ObjectId(input.customerId), deletedAt: null })
      .select("name email")
      .lean()) as { _id: Types.ObjectId; name: string; email: string } | null;
    if (!customer) throw new Error("Customer not found");
  }

  const guestName = customer ? undefined : cleanText(input.guestName, 120) || "Walk-in Guest";
  const customerName = customer?.name || guestName || "Walk-in Guest";
  const notes = cleanText(input.notes, 1000);
  const discountReason = quote.discountAmount > 0 ? cleanText(input.discountReason, 200) : undefined;
  const currency = settings?.currency || "USD";
  const businessName = settings?.businessName || "FLINT";
  const businessAddress = formatBusinessAddress(settings?.address);
  const contact = [settings?.phone, settings?.email].filter((part) => part && part.trim()).join(" · ");
  const businessBlock = [businessAddress, contact || null].filter(Boolean).join("\n") || null;

  const posId = new Types.ObjectId();
  const orderId = new Types.ObjectId();
  const paymentId = new Types.ObjectId();
  const receiptNo = receiptNumber();
  const orderNo = orderNumber();
  const paymentNo = paymentNumber();
  const soldAt = new Date();

  const applied: AppliedDeduction[] = [];
  try {
    for (const line of priced) {
      const result = await deductLine({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        sku: line.sku,
        name: line.name,
        posId,
        cashierId,
        receiptNo,
      });
      applied.push({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        movementId: result.movementId,
        stockAfter: result.stockAfter,
      });
    }

    const orderItems = priced.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      sku: line.sku,
      name: line.name,
      imageUrl: line.imageUrl,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      taxRate: quote.taxRate,
      discountAmount: 0,
      lineTotal: line.lineTotal,
    }));

    await Payment.create({
      _id: paymentId,
      paymentNumber: paymentNo,
      orderId,
      posTransactionId: posId,
      customerId: customer?._id,
      method: input.paymentMethod,
      amount: quote.total,
      currency,
      status: "completed",
      reference: receiptNo,
      notes: notes || `POS ${receiptNo}`,
      receivedBy: cashierId,
      paidAt: soldAt,
    });

    await POSTransaction.create({
      _id: posId,
      receiptNumber: receiptNo,
      cashierId,
      customerId: customer?._id,
      guestName,
      items: orderItems.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        sku: line.sku,
        name: line.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        taxRate: quote.taxRate,
        discountAmount: 0,
        lineTotal: line.lineTotal,
      })),
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      discountReason,
      taxAmount: quote.taxAmount,
      total: quote.total,
      paymentMethod: input.paymentMethod,
      amountTendered,
      changeGiven,
      paymentId,
      orderId,
      status: "completed",
      notes,
    });

    await Order.create({
      _id: orderId,
      orderNumber: orderNo,
      source: "pos",
      customerId: customer?._id,
      guestEmail: customer?.email ?? guestName,
      items: orderItems,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      shippingAmount: 0,
      total: quote.total,
      currency,
      status: "completed",
      paymentStatus: "paid",
      paymentMethod: input.paymentMethod,
      paymentId,
      notes,
      internalNotes: `POS receipt ${receiptNo}`,
      placedAt: soldAt,
    });

    if (customer) {
      await Customer.updateOne(
        { _id: customer._id },
        { $inc: { orderCount: 1, totalSpent: quote.total } },
      );
    }
  } catch (error) {
    try {
      await rollbackDeductions(applied);
      await Payment.deleteOne({ _id: paymentId });
      await Order.deleteOne({ _id: orderId });
      await POSTransaction.deleteOne({ _id: posId });
    } catch (rollbackError) {
      console.error("POS checkout rollback failed", rollbackError);
      throw new Error("Sale failed and stock could not be fully restored. Check inventory before retrying.");
    }
    throw error instanceof Error ? error : new Error("Sale could not be completed");
  }

  const receipt: PosReceipt = {
    id: String(posId),
    receiptNumber: receiptNo,
    orderId: String(orderId),
    orderNumber: orderNo,
    status: "completed",
    createdAt: soldAt.toISOString(),
    businessName,
    businessAddress: businessBlock,
    currency,
    cashierName: session.name,
    customerName,
    items: priced.map((line) => ({
      name: line.name,
      sku: line.sku,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    subtotal: quote.subtotal,
    discountAmount: quote.discountAmount,
    discountReason: discountReason ?? null,
    taxAmount: quote.taxAmount,
    taxRate: quote.taxRate,
    taxInclusive,
    total: quote.total,
    paymentMethod: input.paymentMethod,
    paymentLabel: paymentOption.label || PAYMENT_LABELS[input.paymentMethod],
    amountTendered: amountTendered ?? null,
    changeGiven: changeGiven ?? null,
    notes: notes ?? null,
  };

  try {
    await writeAuditLog({
      actor: session,
      action: "pos.checkout",
      entityType: "POSTransaction",
      entityId: receipt.id,
      summary: `Completed POS sale ${receipt.receiptNumber} for ${quote.total.toFixed(2)} ${currency}`,
      changes: {
        orderNumber: orderNo,
        paymentMethod: input.paymentMethod,
        total: quote.total,
        itemCount: priced.length,
      },
    });
  } catch (error) {
    console.error("Failed to write POS checkout audit log", error);
  }

  return {
    receipt,
    stock: applied.map((row) => ({
      productId: String(row.productId),
      variantId: row.variantId ? String(row.variantId) : null,
      stock: row.stockAfter,
    })),
  };
}

async function addStockForRefund(args: {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantity: number;
  sku: string;
  name: string;
  posId: Types.ObjectId;
  cashierId: Types.ObjectId;
  receiptNo: string;
}): Promise<RestoredLine> {
  const updated = (await Product.findOneAndUpdate(
    args.variantId
      ? { _id: args.productId, deletedAt: null, "variants._id": args.variantId }
      : { _id: args.productId, deletedAt: null },
    args.variantId
      ? { $inc: { "variants.$.stock": args.quantity } }
      : { $inc: { stock: args.quantity } },
    { returnDocument: "after" },
  ).lean()) as StockSnapshot | null;

  if (!updated) throw new Error(`Could not restore stock for ${args.name}`);

  const sold = await Product.updateOne(
    { _id: args.productId, soldCount: { $gte: args.quantity } },
    { $inc: { soldCount: -args.quantity } },
  );
  const soldAdjusted = sold.modifiedCount > 0;
  const after = args.variantId
    ? (updated.variants?.find((variant) => String(variant._id) === String(args.variantId))?.stock ?? 0)
    : (updated.stock ?? 0);

  try {
    const movement = await InventoryMovement.create({
      productId: args.productId,
      variantId: args.variantId,
      sku: args.sku,
      type: "refund",
      quantityChange: args.quantity,
      quantityBefore: after - args.quantity,
      quantityAfter: after,
      reason: `POS refund ${args.receiptNo}`,
      referenceType: "pos",
      referenceId: args.posId,
      performedBy: args.cashierId,
    });
    return {
      productId: args.productId,
      variantId: args.variantId,
      quantity: args.quantity,
      movementId: movement._id,
      soldAdjusted,
    };
  } catch (error) {
    if (args.variantId) {
      await Product.updateOne(
        { _id: args.productId, "variants._id": args.variantId },
        { $inc: { "variants.$.stock": -args.quantity } },
      );
    } else {
      await Product.updateOne({ _id: args.productId }, { $inc: { stock: -args.quantity } });
    }
    if (soldAdjusted) {
      await Product.updateOne({ _id: args.productId }, { $inc: { soldCount: args.quantity } });
    }
    throw error;
  }
}

async function undoRefundLine(row: RestoredLine) {
  await Product.findOneAndUpdate(
    row.variantId
      ? {
          _id: row.productId,
          variants: { $elemMatch: { _id: row.variantId, stock: { $gte: row.quantity } } },
        }
      : { _id: row.productId, stock: { $gte: row.quantity } },
    row.variantId
      ? { $inc: { "variants.$.stock": -row.quantity } }
      : { $inc: { stock: -row.quantity } },
  );
  if (row.soldAdjusted) {
    await Product.updateOne({ _id: row.productId }, { $inc: { soldCount: row.quantity } });
  }
  await InventoryMovement.deleteOne({ _id: row.movementId });
}

export async function refundPosSale(id: string, session: SessionUser) {
  await connectToDatabase();
  if (!hasPermission(session, "pos.refund")) {
    throw new Error("You do not have permission to refund sales");
  }
  if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(session.id)) {
    throw new Error("Sale not found");
  }

  const existing = await POSTransaction.findById(id);
  if (!existing) throw new Error("Sale not found");
  if (existing.status !== "completed") throw new Error("Only completed sales can be refunded");

  for (const item of existing.items) {
    const product = await Product.findOne({ _id: item.productId, deletedAt: null }).select("name variants");
    if (!product) throw new Error(`Cannot refund because ${item.name} is no longer in the catalogue`);
    if (item.variantId) {
      const variant = product.variants?.find((entry) => String(entry._id) === String(item.variantId));
      if (!variant) throw new Error(`Cannot refund because a variant of ${item.name} is missing`);
    }
  }

  const locked = await POSTransaction.findOneAndUpdate(
    { _id: existing._id, status: "completed" },
    { $set: { status: "refunded" } },
    { returnDocument: "after" },
  );
  if (!locked) throw new Error("This sale was already refunded");

  const cashierId = new Types.ObjectId(session.id);
  const restored: RestoredLine[] = [];
  let paymentMarked = false;
  let orderMarked = false;
  let customerRevert: { id: Types.ObjectId; orderCount: number; totalSpent: number } | null = null;

  try {
    for (const item of locked.items) {
      restored.push(
        await addStockForRefund({
          productId: item.productId as Types.ObjectId,
          variantId: item.variantId ? new Types.ObjectId(String(item.variantId)) : undefined,
          quantity: item.quantity,
          sku: item.sku,
          name: item.name,
          posId: locked._id,
          cashierId,
          receiptNo: locked.receiptNumber,
        }),
      );
    }

    if (locked.paymentId) {
      await Payment.updateOne({ _id: locked.paymentId }, { $set: { status: "refunded" } });
      paymentMarked = true;
    }
    if (locked.orderId) {
      await Order.updateOne(
        { _id: locked.orderId },
        { $set: { status: "refunded", paymentStatus: "refunded" } },
      );
      orderMarked = true;
    }
    if (locked.customerId) {
      const customer = await Customer.findById(locked.customerId);
      if (customer) {
        customerRevert = {
          id: customer._id,
          orderCount: customer.orderCount ?? 0,
          totalSpent: customer.totalSpent ?? 0,
        };
        customer.orderCount = Math.max(0, (customer.orderCount ?? 0) - 1);
        customer.totalSpent = Math.max(0, roundMoney((customer.totalSpent ?? 0) - (locked.total ?? 0)));
        await customer.save();
      }
    }
  } catch (error) {
    try {
      for (const row of [...restored].reverse()) {
        await undoRefundLine(row);
      }
      if (paymentMarked && locked.paymentId) {
        await Payment.updateOne({ _id: locked.paymentId }, { $set: { status: "completed" } });
      }
      if (orderMarked && locked.orderId) {
        await Order.updateOne(
          { _id: locked.orderId },
          { $set: { status: "completed", paymentStatus: "paid" } },
        );
      }
      if (customerRevert) {
        await Customer.updateOne(
          { _id: customerRevert.id },
          { $set: { orderCount: customerRevert.orderCount, totalSpent: customerRevert.totalSpent } },
        );
      }
      await POSTransaction.updateOne({ _id: locked._id, status: "refunded" }, { $set: { status: "completed" } });
    } catch (rollbackError) {
      console.error("POS refund rollback failed", rollbackError);
      throw new Error("Refund failed partway. Check this receipt and inventory before trying again.");
    }
    throw error instanceof Error ? error : new Error("Refund could not be completed");
  }

  try {
    await writeAuditLog({
      actor: session,
      action: "pos.refund",
      entityType: "POSTransaction",
      entityId: String(locked._id),
      summary: `Refunded POS receipt ${locked.receiptNumber}`,
    });
  } catch (error) {
    console.error("Failed to write POS refund audit log", error);
  }

  return {
    id: String(locked._id),
    receiptNumber: locked.receiptNumber,
    status: "refunded" as const,
  };
}
