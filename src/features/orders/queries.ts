import "server-only";
import { connection } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Order } from "@/models";
import type { SessionUser } from "@/types";

export type PlainOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  itemCount: number;
  placedAt: string;
};

export type PlainOrderDetail = PlainOrderListItem & {
  items: Array<{
    name: string;
    sku: string;
    imageUrl?: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  shippingAddress?: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  paymentMethod?: string;
  couponCode?: string;
  notes?: string;
};

export async function getCustomerOrders(user: SessionUser): Promise<PlainOrderListItem[]> {
  await connection();
  await connectToDatabase();

  const filter = user.customerId
    ? { customerId: user.customerId, deletedAt: null }
    : { guestEmail: user.email.toLowerCase(), deletedAt: null };

  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

  return orders.map((order) => ({
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    currency: order.currency ?? "USD",
    itemCount:
      order.items?.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0,
      ) ?? 0,
    placedAt: order.placedAt
      ? new Date(order.placedAt).toISOString()
      : order.createdAt
        ? new Date(order.createdAt).toISOString()
        : "",
  }));
}

export async function getCustomerOrderByNumber(
  user: SessionUser,
  orderNumber: string,
): Promise<PlainOrderDetail | null> {
  await connection();
  await connectToDatabase();

  const filter = user.customerId
    ? { orderNumber, customerId: user.customerId, deletedAt: null }
    : { orderNumber, guestEmail: user.email.toLowerCase(), deletedAt: null };

  const order = await Order.findOne(filter).lean();
  if (!order) return null;

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    currency: order.currency ?? "USD",
    itemCount:
      order.items?.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0,
      ) ?? 0,
    placedAt: order.placedAt
      ? new Date(order.placedAt).toISOString()
      : order.createdAt
        ? new Date(order.createdAt).toISOString()
        : "",
    items: (order.items ?? []).map(
      (item: {
        name: string;
        sku: string;
        imageUrl?: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
      }) => ({
      name: item.name,
      sku: item.sku,
      imageUrl: item.imageUrl ?? undefined,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    shippingAddress: order.shippingAddress
      ? {
          fullName: order.shippingAddress.fullName,
          phone: order.shippingAddress.phone,
          line1: order.shippingAddress.line1,
          line2: order.shippingAddress.line2 ?? undefined,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state ?? undefined,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        }
      : undefined,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount ?? 0,
    taxAmount: order.taxAmount ?? 0,
    shippingAmount: order.shippingAmount ?? 0,
    paymentMethod: order.paymentMethod || undefined,
    couponCode: order.couponCode ?? undefined,
    notes: order.notes ?? undefined,
  };
}
