import {
  DEFAULT_PAYMENT_METHODS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/constants";

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Seed data stores tax as a fraction (0.08). The settings field is also labeled as a percent,
 * so values above 1 are treated as percents (8 → 0.08).
 */
export function normalizeTaxRate(rate: number) {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  if (rate > 1) return rate / 100;
  return rate;
}

export function quotePosTotals(input: {
  lines: { unitPrice: number; quantity: number }[];
  discountAmount: number;
  taxRate: number;
  taxInclusive: boolean;
}) {
  const subtotal = roundMoney(
    input.lines.reduce((sum, line) => sum + roundMoney(line.unitPrice * line.quantity), 0),
  );
  const requested = roundMoney(Math.max(input.discountAmount || 0, 0));
  const discountAmount = roundMoney(Math.min(requested, subtotal));
  const taxable = roundMoney(Math.max(subtotal - discountAmount, 0));
  const taxRate = normalizeTaxRate(input.taxRate);
  const taxAmount = input.taxInclusive
    ? taxRate > 0
      ? roundMoney(taxable - taxable / (1 + taxRate))
      : 0
    : roundMoney(taxable * taxRate);
  const total = input.taxInclusive ? taxable : roundMoney(taxable + taxAmount);
  return { subtotal, discountAmount, taxable, taxAmount, taxRate, total };
}

export function inferTaxInclusive(
  subtotal: number,
  discountAmount: number,
  taxAmount: number,
  total: number,
) {
  const taxable = roundMoney(Math.max(subtotal - discountAmount, 0));
  if (taxAmount <= 0) return false;
  return Math.abs(roundMoney(total) - taxable) < 0.02;
}

export function formatTaxPercent(rate: number) {
  const percent = roundMoney(normalizeTaxRate(rate) * 100);
  if (Number.isInteger(percent)) return `${percent.toFixed(0)}%`;
  return `${percent.toFixed(2).replace(/\.?0+$/, "")}%`;
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank transfer",
  other: "Other",
};

export function resolvePaymentMethods(
  methods:
    | { id?: string | null; label?: string | null; enabled?: boolean | null }[]
    | null
    | undefined,
): { id: PaymentMethod; label: string }[] {
  const allowed = new Set<string>(PAYMENT_METHODS);
  const resolved: { id: PaymentMethod; label: string }[] = [];
  for (const method of methods ?? []) {
    if (!method?.enabled || !method.id || !allowed.has(method.id)) continue;
    const id = method.id as PaymentMethod;
    resolved.push({
      id,
      label: method.label?.trim() || PAYMENT_LABELS[id],
    });
  }
  if (resolved.length > 0) return resolved;
  return DEFAULT_PAYMENT_METHODS.map((method) => ({
    id: method.id,
    label: method.label,
  }));
}

export function formatBusinessAddress(
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null,
) {
  if (!address) return null;
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(" ");
  const lines = [address.line1, address.line2, cityLine || null, address.country].filter(
    (line): line is string => Boolean(line && String(line).trim()),
  );
  return lines.length > 0 ? lines.join("\n") : null;
}
