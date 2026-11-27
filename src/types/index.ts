import type {
  CustomOrderStatus,
  InventoryMovementType,
  OrderStatus,
  PaymentMethod,
  Permission,
  ProductStatus,
  UserRole,
} from "@/constants";

export type SoftDelete = {
  deletedAt?: Date | null;
};

export type MediaRef = {
  key: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  size?: number;
};

export type Money = {
  amount: number;
  currency: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  customerId?: string;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  customerId?: string;
  name: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ApiError = {
  error: string;
  details?: unknown;
};

export type ProductFilterInput = {
  q?: string;
  category?: string;
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "name" | "bestselling";
  page?: number;
  pageSize?: number;
  status?: ProductStatus;
};

export type CheckoutAddressInput = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
};

export type CartLineInput = {
  productId: string;
  variantId?: string;
  quantity: number;
  customization?: Record<string, string>;
};

export type PosCartLine = {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  taxRate: number;
};

export type DashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  pendingCustomOrders: number;
  pendingPayments: number;
};

export type SalesPoint = {
  date: string;
  online: number;
  pos: number;
};

export type { CustomOrderStatus, InventoryMovementType, OrderStatus, PaymentMethod, Permission, ProductStatus, UserRole };
