import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { orderNumber, paymentNumber } from "@/lib/ids";
import type { CheckoutInput } from "@/lib/validation/checkout";
import type { SessionUser } from "@/types";
import {
  BusinessSettings,
  Coupon,
  Customer,
  InventoryMovement,
  Order,
  Payment,
  Product,
} from "@/models";

type PricedLine = {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  sku: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
  customization?: Record<string, string>;
  ageRestriction: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function placeOnlineOrder(input: CheckoutInput, session: SessionUser | null) {
  await connectToDatabase();

  const settings = await BusinessSettings.findOne({ key: "default" }).lean();
  const taxRate = settings?.taxRate ?? 0;
  const shippingCfg = settings?.shipping;
  const restricted = new Set(shippingCfg?.restrictedCountries ?? []);

  if (restricted.has(input.shippingAddress.country.toUpperCase())) {
    throw new Error("Shipping is not available to the selected destination");
  }

  const pricedLines: PricedLine[] = [];

  for (const item of input.items) {
    if (!Types.ObjectId.isValid(item.productId)) {
      throw new Error("Invalid product in cart");
    }

    const product = await Product.findOne({
      _id: new Types.ObjectId(item.productId),
      status: "active",
      deletedAt: null,
    }).exec();

    if (!product) {
      throw new Error("One or more products are unavailable");
    }

    let unitPrice = product.price;
    let sku = product.sku;
    let stock = product.stock;
    let variantId: Types.ObjectId | undefined;

    if (item.variantId) {
      const variant = product.variants?.find((v) => String(v._id) === item.variantId);
      if (!variant || !variant.isActive) {
        throw new Error(`Variant unavailable for ${product.name}`);
      }
      unitPrice = variant.price;
      sku = variant.sku;
      stock = variant.stock ?? 0;
      variantId = new Types.ObjectId(String(variant._id));
    }

    if (stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    if ((product.ageRestriction ?? 0) > 0 && !input.ageConfirmed) {
      throw new Error(`Age confirmation is required for ${product.name}`);
    }

    const lineTotal = roundMoney(unitPrice * item.quantity);
    pricedLines.push({
      productId: product._id,
      variantId,
      sku,
      name: product.name,
      imageUrl: product.images?.[0]?.url,
      unitPrice,
      quantity: item.quantity,
      taxRate: product.taxRate ?? taxRate,
      discountAmount: 0,
      lineTotal,
      customization: item.customization,
      ageRestriction: product.ageRestriction ?? 0,
    });
  }

  let subtotal = roundMoney(pricedLines.reduce((sum, line) => sum + line.lineTotal, 0));
  let discountAmount = 0;
  let couponCode: string | undefined;

  if (input.couponCode) {
    const coupon = await Coupon.findOne({
      code: input.couponCode.toUpperCase(),
      isActive: true,
      deletedAt: null,
    });

    if (!coupon) throw new Error("Invalid coupon code");
    if (coupon.startsAt && coupon.startsAt > new Date()) throw new Error("Coupon is not active yet");
    if (coupon.endsAt && coupon.endsAt < new Date()) throw new Error("Coupon has expired");
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new Error("Coupon usage limit reached");
    }
    if (subtotal < (coupon.minOrderAmount ?? 0)) {
      throw new Error(`Coupon requires a minimum order of ${coupon.minOrderAmount}`);
    }

    discountAmount =
      coupon.type === "percentage"
        ? roundMoney((subtotal * coupon.value) / 100)
        : roundMoney(coupon.value);

    if (coupon.maxDiscountAmount != null) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }

    discountAmount = Math.min(discountAmount, subtotal);
    couponCode = coupon.code;
    coupon.usedCount += 1;
    await coupon.save();
  }

  const taxableBase = Math.max(subtotal - discountAmount, 0);
  const taxAmount = roundMoney(
    pricedLines.reduce((sum, line) => {
      const share = line.lineTotal / (subtotal || 1);
      const lineDiscount = discountAmount * share;
      return sum + (line.lineTotal - lineDiscount) * (line.taxRate || taxRate);
    }, 0),
  );

  let shippingAmount = shippingCfg?.flatRate ?? 15;
  if (shippingCfg?.freeOver != null && taxableBase >= shippingCfg.freeOver) {
    shippingAmount = 0;
  }

  const total = roundMoney(taxableBase + taxAmount + shippingAmount);

  let customerId = session?.customerId ? new Types.ObjectId(session.customerId) : undefined;
  if (!customerId) {
    const existing = await Customer.findOne({
      email: input.email.toLowerCase(),
      deletedAt: null,
    }).exec();
    if (existing) {
      customerId = existing._id;
    } else {
      const created = await Customer.create({
        name: input.shippingAddress.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone || input.shippingAddress.phone,
        userId: session?.id ? new Types.ObjectId(session.id) : undefined,
        addresses: [{ ...input.shippingAddress, isDefault: true, label: "Shipping" }],
      });
      customerId = created._id;
    }
  }

  // Atomic stock deduction per line
  for (const line of pricedLines) {
    if (line.variantId) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: line.productId,
          "variants._id": line.variantId,
          "variants.stock": { $gte: line.quantity },
          deletedAt: null,
        },
        {
          $inc: {
            "variants.$.stock": -line.quantity,
            soldCount: line.quantity,
          },
        },
        { new: true },
      );
      if (!updated) throw new Error(`Could not reserve stock for ${line.name}`);

      const variant = updated.variants?.find((v) => String(v._id) === String(line.variantId));
      await InventoryMovement.create({
        productId: line.productId,
        variantId: line.variantId,
        sku: line.sku,
        type: "sale_online",
        quantityChange: -line.quantity,
        quantityBefore: (variant?.stock ?? 0) + line.quantity,
        quantityAfter: variant?.stock ?? 0,
        referenceType: "order",
        performedBy: session?.id ? new Types.ObjectId(session.id) : undefined,
        reason: "Online order",
      });
    } else {
      const updated = await Product.findOneAndUpdate(
        {
          _id: line.productId,
          stock: { $gte: line.quantity },
          deletedAt: null,
        },
        {
          $inc: { stock: -line.quantity, soldCount: line.quantity },
        },
        { new: true },
      );
      if (!updated) throw new Error(`Could not reserve stock for ${line.name}`);

      await InventoryMovement.create({
        productId: line.productId,
        sku: line.sku,
        type: "sale_online",
        quantityChange: -line.quantity,
        quantityBefore: updated.stock + line.quantity,
        quantityAfter: updated.stock,
        referenceType: "order",
        performedBy: session?.id ? new Types.ObjectId(session.id) : undefined,
        reason: "Online order",
      });
    }
  }

  const payment = await Payment.create({
    paymentNumber: paymentNumber(),
    customerId,
    method: input.paymentMethod,
    amount: total,
    currency: settings?.currency ?? "USD",
    status: "pending",
    notes: "Awaiting confirmation of configured payment method",
    receivedBy: session?.id ? new Types.ObjectId(session.id) : undefined,
  });

  const order = await Order.create({
    orderNumber: orderNumber("FL"),
    source: "online",
    customerId,
    userId: session?.id ? new Types.ObjectId(session.id) : undefined,
    guestEmail: input.email.toLowerCase(),
    items: pricedLines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      sku: line.sku,
      name: line.name,
      imageUrl: line.imageUrl,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      taxRate: line.taxRate,
      discountAmount: 0,
      lineTotal: line.lineTotal,
      customization: line.customization,
    })),
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingSameAsShipping
      ? input.shippingAddress
      : input.billingAddress ?? input.shippingAddress,
    subtotal,
    discountAmount,
    taxAmount,
    shippingAmount,
    total,
    currency: settings?.currency ?? "USD",
    couponCode,
    status: "awaiting_payment",
    paymentStatus: "pending",
    paymentMethod: input.paymentMethod,
    paymentId: payment._id,
    notes: input.notes,
    placedAt: new Date(),
  });

  payment.orderId = order._id;
  await payment.save();

  await Customer.findByIdAndUpdate(customerId, {
    $inc: { orderCount: 1, totalSpent: total },
  });

  return {
    order: {
      id: String(order._id),
      orderNumber: order.orderNumber,
      total: order.total,
      currency: order.currency,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
    },
  };
}
