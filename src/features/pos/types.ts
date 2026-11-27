import type { PaymentMethod } from "@/constants";

export type PosCatalogItem = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  displayName: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  minStockLevel: number;
  imageUrl: string | null;
  categoryIds: string[];
  ageRestriction: number;
};

export type PosCategory = {
  id: string;
  name: string;
};

export type PosPaymentOption = {
  id: PaymentMethod;
  label: string;
};

export type PosTerminalData = {
  items: PosCatalogItem[];
  categories: PosCategory[];
  paymentMethods: PosPaymentOption[];
  taxRate: number;
  taxInclusive: boolean;
  currency: string;
  businessName: string;
  businessAddress: string | null;
  cashierName: string;
  canDiscount: boolean;
};

export type PosCheckoutInput = {
  items: { productId: string; variantId?: string | null; quantity: number }[];
  customerId?: string | null;
  guestName?: string | null;
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  discountReason?: string | null;
  amountTendered?: number | null;
  notes?: string | null;
};

export type PosReceiptItem = {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PosReceipt = {
  id: string;
  receiptNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  status: "completed" | "refunded" | "voided";
  createdAt: string;
  businessName: string;
  businessAddress: string | null;
  currency: string;
  cashierName: string;
  customerName: string;
  items: PosReceiptItem[];
  subtotal: number;
  discountAmount: number;
  discountReason: string | null;
  taxAmount: number;
  taxRate: number;
  taxInclusive: boolean;
  total: number;
  paymentMethod: PaymentMethod;
  paymentLabel: string;
  amountTendered: number | null;
  changeGiven: number | null;
  notes: string | null;
};

export type PosStockUpdate = {
  productId: string;
  variantId: string | null;
  stock: number;
};

export type PosCheckoutResult = {
  receipt: PosReceipt;
  stock: PosStockUpdate[];
};

export type PosSaleRow = {
  id: string;
  receiptNumber: string;
  createdAt: string;
  status: "completed" | "refunded" | "voided";
  customerName: string;
  cashierName: string;
  paymentMethod: PaymentMethod;
  total: number;
  itemCount: number;
};

export type PosCustomerHit = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};
