import "server-only";

import { ORDER_STATUSES, PAYMENT_METHODS } from "@/constants";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { BusinessSettings } from "@/models/BusinessSettings";
import { Order } from "@/models/Order";
import { POSTransaction } from "@/models/POSTransaction";
import { Product } from "@/models/Product";
import { formatDay, rangeLengthDays, type ReportRange } from "@/features/reports/range";

/** Paid, fulfilled, or completed. Excludes unpaid, cancelled, and refunded orders. */
const PAID_ORDER_STATUSES = ["paid", "processing", "shipped", "delivered", "completed"] as const;

const ORDER_SOURCES = ["online", "pos", "custom"] as const;

export type SalesChannel = {
  revenue: number;
  count: number;
  aov: number;
};

export type SalesSeriesRow = {
  date: string;
  onlineRevenue: number;
  posRevenue: number;
  totalRevenue: number;
};

export type TopProductRow = {
  sku: string;
  name: string;
  quantity: number;
  revenue: number;
};

export type SalesOverview = {
  online: SalesChannel;
  pos: SalesChannel;
  combined: SalesChannel;
  series: SalesSeriesRow[];
  seriesTruncated: boolean;
  topProducts: TopProductRow[];
};

export type BreakdownRow = {
  key: string;
  count: number;
  total: number;
};

export type OrderReport = {
  totalOrders: number;
  totalAmount: number;
  byStatus: BreakdownRow[];
  bySource: BreakdownRow[];
};

export type StockRow = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStockLevel: number;
  stockValue: number;
  retailValue: number;
};

export type InventoryReport = {
  skuCount: number;
  stockValue: number;
  retailValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStock: StockRow[];
  outOfStock: StockRow[];
};

export type PosMethodRow = {
  method: string;
  count: number;
  total: number;
};

export type PosReport = {
  completed: { count: number; total: number };
  refunded: { count: number; total: number };
  byPaymentMethod: PosMethodRow[];
};

type DailyBucket = { revenue: number; count: number };
type ProductBucket = { sku: string; name: string; quantity: number; revenue: number };

function num(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function channel(revenue: number, count: number): SalesChannel {
  return {
    revenue: roundMoney(revenue),
    count,
    aov: count > 0 ? roundMoney(revenue / count) : 0,
  };
}

function orderWindow(range: ReportRange) {
  return {
    deletedAt: null,
    $or: [
      { placedAt: { $gte: range.from, $lte: range.to } },
      { placedAt: null, createdAt: { $gte: range.from, $lte: range.to } },
    ],
  };
}

export async function getReportCurrency() {
  await connectToDatabase();
  const doc = await BusinessSettings.findOne({ key: "default" }).select("currency").lean();
  const currency = typeof doc?.currency === "string" ? doc.currency.trim().toUpperCase() : "";
  return /^[A-Z]{3}$/.test(currency) ? currency : "USD";
}

type SalesFacet = {
  totals: { revenue?: number; count?: number }[];
  daily: { _id?: string; revenue?: number; count?: number }[];
  products: { _id?: { sku?: string; name?: string }; quantity?: number; revenue?: number }[];
};

function readDaily(rows: SalesFacet["daily"]) {
  const map = new Map<string, DailyBucket>();
  for (const row of rows) {
    const key = String(row._id ?? "");
    if (!key) continue;
    map.set(key, { revenue: roundMoney(num(row.revenue)), count: num(row.count) });
  }
  return map;
}

function readProducts(rows: SalesFacet["products"]): ProductBucket[] {
  return rows.map((row) => {
    const sku = String(row._id?.sku ?? "").trim();
    const name = String(row._id?.name ?? "").trim();
    return {
      sku: sku || "—",
      name: name || sku || "Product",
      quantity: num(row.quantity),
      revenue: roundMoney(num(row.revenue)),
    };
  });
}

function mergeProducts(groups: ProductBucket[][]) {
  const map = new Map<string, ProductBucket>();
  for (const group of groups) {
    for (const row of group) {
      const key = row.sku !== "—" ? row.sku : row.name;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { ...row });
        continue;
      }
      if (row.revenue > prev.revenue && row.name) prev.name = row.name;
      prev.quantity += row.quantity;
      prev.revenue = roundMoney(prev.revenue + row.revenue);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity).slice(0, 10);
}

function fillSeries(range: ReportRange, online: Map<string, DailyBucket>, pos: Map<string, DailyBucket>) {
  const toRow = (date: string): SalesSeriesRow => {
    const onlineRevenue = online.get(date)?.revenue ?? 0;
    const posRevenue = pos.get(date)?.revenue ?? 0;
    return {
      date,
      onlineRevenue,
      posRevenue,
      totalRevenue: roundMoney(onlineRevenue + posRevenue),
    };
  };

  if (rangeLengthDays(range) > 92) {
    const keys = new Set([...online.keys(), ...pos.keys()]);
    const rows = [...keys]
      .filter((key) => key >= range.fromInput && key <= range.toInput)
      .sort()
      .map(toRow);
    return { series: rows, seriesTruncated: true };
  }

  const series: SalesSeriesRow[] = [];
  const cursor = new Date(range.from);
  let guard = 0;
  while (guard < 100) {
    const key = formatDay(cursor);
    series.push(toRow(key));
    if (key >= range.toInput) break;
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return { series, seriesTruncated: false };
}

async function salesFacet(match: Record<string, unknown>, dateField: string) {
  const [result] = (await (dateField === "placedAt" ? Order : POSTransaction).aggregate([
    { $match: match },
    {
      $facet: {
        totals: [{ $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } }],
        daily: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: dateField === "placedAt" ? { $ifNull: ["$placedAt", "$createdAt"] } : "$createdAt",
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
                },
              },
              revenue: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
        ],
        products: [
          { $unwind: "$items" },
          {
            $group: {
              _id: { sku: "$items.sku", name: "$items.name" },
              quantity: { $sum: "$items.quantity" },
              revenue: { $sum: "$items.lineTotal" },
            },
          },
        ],
      },
    },
  ])) as SalesFacet[];

  return (
    result ?? {
      totals: [],
      daily: [],
      products: [],
    }
  );
}

/**
 * Online revenue is paid online/custom orders.
 * POS revenue is completed register sales.
 * POS orders are not added again, because checkout also writes an Order with source "pos".
 */
export async function getSalesOverview(range: ReportRange): Promise<SalesOverview> {
  await connectToDatabase();
  const [onlineFacet, posFacet] = await Promise.all([
    salesFacet(
      {
        ...orderWindow(range),
        source: { $in: ["online", "custom"] },
        status: { $in: [...PAID_ORDER_STATUSES] },
      },
      "placedAt",
    ),
    salesFacet(
      {
        status: "completed",
        createdAt: { $gte: range.from, $lte: range.to },
      },
      "createdAt",
    ),
  ]);

  const online = channel(num(onlineFacet.totals[0]?.revenue), num(onlineFacet.totals[0]?.count));
  const pos = channel(num(posFacet.totals[0]?.revenue), num(posFacet.totals[0]?.count));
  const combined = channel(online.revenue + pos.revenue, online.count + pos.count);
  const { series, seriesTruncated } = fillSeries(range, readDaily(onlineFacet.daily), readDaily(posFacet.daily));

  return {
    online,
    pos,
    combined,
    series,
    seriesTruncated,
    topProducts: mergeProducts([readProducts(onlineFacet.products), readProducts(posFacet.products)]),
  };
}

function orderedBreakdown(
  rows: { _id?: string; count?: number; total?: number }[],
  keys: readonly string[],
): BreakdownRow[] {
  const map = new Map(rows.map((row) => [String(row._id ?? "unknown"), row]));
  const seen = new Set<string>();
  const ordered: BreakdownRow[] = [];
  for (const key of keys) {
    seen.add(key);
    const row = map.get(key);
    ordered.push({ key, count: num(row?.count), total: roundMoney(num(row?.total)) });
  }
  for (const [key, row] of map) {
    if (seen.has(key)) continue;
    ordered.push({ key, count: num(row.count), total: roundMoney(num(row.total)) });
  }
  return ordered;
}

export async function getOrderReport(range: ReportRange): Promise<OrderReport> {
  await connectToDatabase();
  const [result] = (await Order.aggregate([
    { $match: orderWindow(range) },
    {
      $facet: {
        totals: [{ $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } }],
        bySource: [{ $group: { _id: "$source", count: { $sum: 1 }, total: { $sum: "$total" } } }],
      },
    },
  ])) as {
    totals: { count?: number; total?: number }[];
    byStatus: { _id?: string; count?: number; total?: number }[];
    bySource: { _id?: string; count?: number; total?: number }[];
  }[];

  const facet = result ?? { totals: [], byStatus: [], bySource: [] };
  return {
    totalOrders: num(facet.totals[0]?.count),
    totalAmount: roundMoney(num(facet.totals[0]?.total)),
    byStatus: orderedBreakdown(facet.byStatus, ORDER_STATUSES),
    bySource: orderedBreakdown(facet.bySource, ORDER_SOURCES),
  };
}

function stockValueExpr(kind: "cost" | "retail") {
  const productField = kind === "cost" ? "$costPrice" : "$price";
  const variantField = kind === "cost" ? "$$v.costPrice" : "$$v.price";
  const variantFallback = kind === "cost" ? { $ifNull: ["$costPrice", 0] } : { $ifNull: ["$price", 0] };
  return {
    $cond: [
      { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
      {
        $sum: {
          $map: {
            input: { $ifNull: ["$variants", []] },
            as: "v",
            in: {
              $multiply: [{ $ifNull: ["$$v.stock", 0] }, { $ifNull: [variantField, variantFallback] }],
            },
          },
        },
      },
      { $multiply: [{ $ifNull: ["$stock", 0] }, { $ifNull: [productField, 0] }] },
    ],
  };
}

const lowStockExpr = {
  $and: [
    { $gt: ["$effectiveStock", 0] },
    { $lte: ["$effectiveStock", { $ifNull: ["$minStockLevel", 5] }] },
  ],
};

const outOfStockExpr = { $lte: ["$effectiveStock", 0] };

function readStockRows(rows: Record<string, unknown>[]): StockRow[] {
  return rows.map((row) => ({
    id: String(row._id ?? ""),
    name: String(row.name ?? ""),
    sku: String(row.sku ?? ""),
    stock: num(row.effectiveStock),
    minStockLevel: num(row.minStockLevel ?? 5),
    stockValue: roundMoney(num(row.stockValue)),
    retailValue: roundMoney(num(row.retailValue)),
  }));
}

export async function getInventoryReport(): Promise<InventoryReport> {
  await connectToDatabase();
  const [result] = (await Product.aggregate([
    { $match: { deletedAt: null, status: { $ne: "archived" } } },
    {
      $addFields: {
        effectiveStock: {
          $cond: [
            { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
            { $sum: "$variants.stock" },
            { $ifNull: ["$stock", 0] },
          ],
        },
        stockValue: stockValueExpr("cost"),
        retailValue: stockValueExpr("retail"),
      },
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              skuCount: { $sum: 1 },
              stockValue: { $sum: "$stockValue" },
              retailValue: { $sum: "$retailValue" },
              lowStockCount: { $sum: { $cond: [lowStockExpr, 1, 0] } },
              outOfStockCount: { $sum: { $cond: [outOfStockExpr, 1, 0] } },
            },
          },
        ],
        lowStock: [
          { $match: { $expr: lowStockExpr } },
          { $sort: { effectiveStock: 1, name: 1 } },
          { $limit: 25 },
          {
            $project: {
              name: 1,
              sku: 1,
              effectiveStock: 1,
              minStockLevel: 1,
              stockValue: 1,
              retailValue: 1,
            },
          },
        ],
        outOfStock: [
          { $match: { $expr: outOfStockExpr } },
          { $sort: { name: 1 } },
          { $limit: 25 },
          {
            $project: {
              name: 1,
              sku: 1,
              effectiveStock: 1,
              minStockLevel: 1,
              stockValue: 1,
              retailValue: 1,
            },
          },
        ],
      },
    },
  ])) as {
    totals: {
      skuCount?: number;
      stockValue?: number;
      retailValue?: number;
      lowStockCount?: number;
      outOfStockCount?: number;
    }[];
    lowStock: Record<string, unknown>[];
    outOfStock: Record<string, unknown>[];
  }[];

  const totals = result?.totals[0];
  return {
    skuCount: num(totals?.skuCount),
    stockValue: roundMoney(num(totals?.stockValue)),
    retailValue: roundMoney(num(totals?.retailValue)),
    lowStockCount: num(totals?.lowStockCount),
    outOfStockCount: num(totals?.outOfStockCount),
    lowStock: readStockRows(result?.lowStock ?? []),
    outOfStock: readStockRows(result?.outOfStock ?? []),
  };
}

export async function getPosReport(range: ReportRange): Promise<PosReport> {
  await connectToDatabase();
  const [result] = (await POSTransaction.aggregate([
    { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
    {
      $facet: {
        completed: [
          { $match: { status: "completed" } },
          { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } },
        ],
        refunded: [
          { $match: { status: "refunded" } },
          { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } },
        ],
        methods: [
          { $match: { status: "completed" } },
          { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$total" } } },
        ],
      },
    },
  ])) as {
    completed: { count?: number; total?: number }[];
    refunded: { count?: number; total?: number }[];
    methods: { _id?: string; count?: number; total?: number }[];
  }[];

  const facet = result ?? { completed: [], refunded: [], methods: [] };
  const methodMap = new Map(facet.methods.map((row) => [String(row._id ?? "other"), row]));
  const methods: PosMethodRow[] = PAYMENT_METHODS.map((method) => {
    const row = methodMap.get(method);
    methodMap.delete(method);
    return { method, count: num(row?.count), total: roundMoney(num(row?.total)) };
  });
  for (const [method, row] of methodMap) {
    methods.push({ method, count: num(row.count), total: roundMoney(num(row.total)) });
  }

  return {
    completed: {
      count: num(facet.completed[0]?.count),
      total: roundMoney(num(facet.completed[0]?.total)),
    },
    refunded: {
      count: num(facet.refunded[0]?.count),
      total: roundMoney(num(facet.refunded[0]?.total)),
    },
    byPaymentMethod: methods,
  };
}
