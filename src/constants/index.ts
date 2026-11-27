export const BRAND = {
  name: "FLINT",
  tagline: "Hand-forged blades for a lifetime",
  email: "atelier@flint.studio",
  phone: "+1 (800) 555-0199",
} as const;

export const USER_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "cashier",
  "catalog_manager",
  "order_manager",
  "customer",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
  "dashboard.view",
  "products.view",
  "products.manage",
  "categories.manage",
  "collections.manage",
  "customization.manage",
  "reviews.manage",
  "orders.view",
  "orders.manage",
  "custom_orders.view",
  "custom_orders.manage",
  "quotations.manage",
  "returns.manage",
  "inventory.view",
  "inventory.manage",
  "pos.access",
  "pos.discount",
  "pos.refund",
  "customers.view",
  "customers.manage",
  "cms.manage",
  "marketing.manage",
  "reports.view",
  "reports.financial",
  "settings.view",
  "settings.manage",
  "users.manage",
  "roles.manage",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Exclude<UserRole, "customer">, Permission[]> = {
  super_admin: [...PERMISSIONS],
  admin: PERMISSIONS.filter((p) => p !== "roles.manage"),
  manager: [
    "dashboard.view",
    "products.view",
    "products.manage",
    "categories.manage",
    "collections.manage",
    "customization.manage",
    "reviews.manage",
    "orders.view",
    "orders.manage",
    "custom_orders.view",
    "custom_orders.manage",
    "quotations.manage",
    "returns.manage",
    "inventory.view",
    "inventory.manage",
    "pos.access",
    "pos.discount",
    "customers.view",
    "customers.manage",
    "cms.manage",
    "marketing.manage",
    "reports.view",
    "settings.view",
  ],
  cashier: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "inventory.view",
    "pos.access",
    "pos.discount",
    "customers.view",
    "customers.manage",
  ],
  catalog_manager: [
    "dashboard.view",
    "products.view",
    "products.manage",
    "categories.manage",
    "collections.manage",
    "customization.manage",
    "reviews.manage",
    "inventory.view",
    "cms.manage",
    "marketing.manage",
  ],
  order_manager: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "orders.manage",
    "custom_orders.view",
    "custom_orders.manage",
    "quotations.manage",
    "returns.manage",
    "customers.view",
    "customers.manage",
    "reports.view",
  ],
};

export const ORDER_STATUSES = [
  "pending",
  "awaiting_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CUSTOM_ORDER_STATUSES = [
  "submitted",
  "under_review",
  "more_info_required",
  "quotation_sent",
  "awaiting_customer_approval",
  "approved",
  "payment_pending",
  "confirmed",
  "in_progress",
  "quality_check",
  "ready",
  "shipped",
  "completed",
  "cancelled",
] as const;

export type CustomOrderStatus = (typeof CUSTOM_ORDER_STATUSES)[number];

export const PRODUCT_STATUSES = ["draft", "active", "archived", "out_of_stock"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const INVENTORY_MOVEMENT_TYPES = [
  "purchase",
  "sale_online",
  "sale_pos",
  "adjustment",
  "return",
  "refund",
  "damage",
  "transfer",
] as const;

export type InventoryMovementType = (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const DEFAULT_PAYMENT_METHODS = [
  { id: "cash", label: "Cash", enabled: true },
  { id: "card", label: "Card", enabled: true },
  { id: "bank_transfer", label: "Bank Transfer", enabled: true },
  { id: "other", label: "Other", enabled: true },
] as const;

export const UPLOAD_LIMITS = {
  maxFileSizeMb: 8,
  maxFilesPerRequest: 8,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
} as const;
