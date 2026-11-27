import "server-only";

import { connection } from "next/server";
import { Types, type PipelineStage } from "mongoose";
import { INVENTORY_MOVEMENT_TYPES } from "@/constants";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { InventoryMovement } from "@/models/InventoryMovement";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import {
  ADJUSTABLE_MOVEMENT_TYPES,
  stockStatus,
  type InventoryMovementRow,
  type InventoryOverviewItem,
  type InventoryProductOption,
  type InventoryStats,
  type InventoryVariantOption,
  type StockAlertCounts,
  type StockFilter,
} from "@/features/inventory/types";

type StockQuery = StockFilter | "alert";

type ProductLean = {
  _id: unknown;
  name: string;
  sku: string;
  barcode?: string | null;
  stock?: number;
  minStockLevel?: number;
  costPrice?: number;
  price: number;
  images?: { url?: string }[];
  variants?: {
    _id: unknown;
    name: string;
    sku: string;
    barcode?: string | null;
    stock?: number;
  }[];
};

type OverviewRaw = {
  _id: unknown;
  name: string;
  sku: string;
  barcode?: string | null;
  effectiveStock?: number;
  minStockLevel?: number;
  costPrice?: number;
  price?: number;
  valuation?: number;
  variantCount?: number;
  images?: { url?: string }[];
};

type MovementLean = {
  _id: unknown;
  sku: string;
  type: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason?: string | null;
  notes?: string | null;
  referenceType?: string | null;
  referenceId?: unknown;
  createdAt?: Date | string;
  productId?: { _id?: unknown; name?: string } | unknown;
  performedBy?: { _id?: unknown; name?: string } | unknown;
};

const ID_PATTERN = /^[a-f\d]{24}$/i;

async function ensureDb() {
  await connection();
  await connectToDatabase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function minLevelExpr() {
  return { $ifNull: ["$minStockLevel", 5] };
}

function searchableTerm(q?: string) {
  const term = q?.trim().slice(0, 80);
  if (!term) return null;
  return new RegExp(escapeRegex(term), "i");
}

function catalogueMatch(q?: string, includeArchived = false) {
  const match: Record<string, unknown> = { deletedAt: null };
  if (!includeArchived) match.status = { $ne: "archived" };
  const rx = searchableTerm(q);
  if (rx) {
    match.$or = [
      { name: rx },
      { sku: rx },
      { barcode: rx },
      { "variants.sku": rx },
      { "variants.barcode": rx },
    ];
  }
  return match;
}

function effectiveStockStages() {
  return [
    {
      $addFields: {
        variantCount: { $size: { $ifNull: ["$variants", []] } },
        effectiveStock: {
          $cond: [
            { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
            { $sum: "$variants.stock" },
            { $ifNull: ["$stock", 0] },
          ],
        },
        valuation: {
          $cond: [
            { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
            {
              $sum: {
                $map: {
                  input: { $ifNull: ["$variants", []] },
                  as: "v",
                  in: {
                    $multiply: [
                      { $ifNull: ["$$v.stock", 0] },
                      { $ifNull: ["$$v.costPrice", { $ifNull: ["$costPrice", 0] }] },
                    ],
                  },
                },
              },
            },
            { $multiply: [{ $ifNull: ["$stock", 0] }, { $ifNull: ["$costPrice", 0] }] },
          ],
        },
      },
    },
  ];
}

function stockStatusMatch(filter: StockQuery) {
  if (filter === "out") return { $expr: { $lte: ["$effectiveStock", 0] } };
  if (filter === "low") {
    return {
      $expr: {
        $and: [{ $gt: ["$effectiveStock", 0] }, { $lte: ["$effectiveStock", minLevelExpr()] }],
      },
    };
  }
  if (filter === "in") return { $expr: { $gt: ["$effectiveStock", minLevelExpr()] } };
  if (filter === "alert") return { $expr: { $lte: ["$effectiveStock", minLevelExpr()] } };
  return null;
}

function pageWindow(page?: number, pageSize?: number, fallbackSize = 30) {
  const size = Math.min(100, Math.max(1, Math.floor(pageSize ?? fallbackSize)));
  const current = Number.isFinite(page) && (page ?? 0) > 0 ? Math.floor(page as number) : 1;
  return { page: current, pageSize: size, skip: (current - 1) * size };
}

function toVariantOption(variant: NonNullable<ProductLean["variants"]>[number]): InventoryVariantOption {
  return {
    id: String(variant._id),
    name: variant.name,
    sku: variant.sku,
    barcode: variant.barcode ?? null,
    stock: variant.stock ?? 0,
  };
}

function toProductOption(doc: ProductLean): InventoryProductOption {
  return {
    id: String(doc._id),
    name: doc.name,
    sku: doc.sku,
    barcode: doc.barcode ?? null,
    stock: doc.stock ?? 0,
    minStockLevel: doc.minStockLevel ?? 5,
    costPrice: doc.costPrice ?? 0,
    price: doc.price,
    imageUrl: doc.images?.[0]?.url ?? null,
    variants: (doc.variants ?? []).map(toVariantOption),
  };
}

function mapOverviewItem(doc: OverviewRaw): InventoryOverviewItem {
  const minStockLevel = doc.minStockLevel ?? 5;
  const stock = doc.effectiveStock ?? 0;
  return {
    id: String(doc._id),
    name: doc.name,
    sku: doc.sku,
    barcode: doc.barcode ?? null,
    stock,
    minStockLevel,
    costPrice: doc.costPrice ?? 0,
    price: doc.price ?? 0,
    valuation: roundMoney(doc.valuation ?? 0),
    imageUrl: doc.images?.[0]?.url ?? null,
    tracksVariants: (doc.variantCount ?? 0) > 0,
    variantCount: doc.variantCount ?? 0,
    stockStatus: stockStatus(stock, minStockLevel),
  };
}

async function queryInventory(params: {
  q?: string;
  filter: StockQuery;
  page?: number;
  pageSize?: number;
}) {
  await ensureDb();
  const { page, pageSize, skip } = pageWindow(params.page, params.pageSize);
  const pipeline: Record<string, unknown>[] = [
    { $match: catalogueMatch(params.q) },
    ...effectiveStockStages(),
  ];
  const statusMatch = stockStatusMatch(params.filter);
  if (statusMatch) pipeline.push({ $match: statusMatch });

  const rows = (await Product.aggregate([
    ...pipeline,
    {
      $facet: {
        items: [
          { $sort: { effectiveStock: 1, name: 1 } },
          { $skip: skip },
          { $limit: pageSize },
          {
            $project: {
              name: 1,
              sku: 1,
              barcode: 1,
              effectiveStock: 1,
              minStockLevel: 1,
              costPrice: 1,
              price: 1,
              valuation: 1,
              variantCount: 1,
              images: { $slice: [{ $ifNull: ["$images", []] }, 1] },
            },
          },
        ],
        stats: [
          {
            $group: {
              _id: null,
              skuCount: { $sum: 1 },
              unitsOnHand: { $sum: "$effectiveStock" },
              valuation: { $sum: "$valuation" },
              critical: { $sum: { $cond: [{ $lte: ["$effectiveStock", 0] }, 1, 0] } },
            },
          },
        ],
      },
    },
  ] as unknown as PipelineStage[])) as {
    items: OverviewRaw[];
    stats: { skuCount: number; unitsOnHand: number; valuation: number; critical: number }[];
  }[];

  const result = rows[0];
  const statsRow = result?.stats?.[0];
  const stats: InventoryStats = {
    skuCount: statsRow?.skuCount ?? 0,
    unitsOnHand: statsRow?.unitsOnHand ?? 0,
    valuation: roundMoney(statsRow?.valuation ?? 0),
    critical: statsRow?.critical ?? 0,
  };
  const total = stats.skuCount;
  return {
    items: (result?.items ?? []).map(mapOverviewItem),
    stats,
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export async function listInventoryOverview(params: {
  q?: string;
  filter?: StockFilter;
  page?: number;
  pageSize?: number;
}) {
  return queryInventory({
    q: params.q,
    filter: params.filter ?? "all",
    page: params.page,
    pageSize: params.pageSize,
  });
}

export async function listLowStockProducts(params: { page?: number; pageSize?: number } = {}) {
  return queryInventory({ filter: "alert", page: params.page, pageSize: params.pageSize ?? 40 });
}

export async function getStockAlertCounts(q?: string): Promise<StockAlertCounts> {
  await ensureDb();
  const rows = (await Product.aggregate([
    { $match: catalogueMatch(q) },
    ...effectiveStockStages(),
    {
      $group: {
        _id: null,
        all: { $sum: 1 },
        out: { $sum: { $cond: [{ $lte: ["$effectiveStock", 0] }, 1, 0] } },
        low: {
          $sum: {
            $cond: [
              {
                $and: [{ $gt: ["$effectiveStock", 0] }, { $lte: ["$effectiveStock", minLevelExpr()] }],
              },
              1,
              0,
            ],
          },
        },
        in: { $sum: { $cond: [{ $gt: ["$effectiveStock", minLevelExpr()] }, 1, 0] } },
      },
    },
  ] as unknown as PipelineStage[])) as { all: number; low: number; out: number; in: number }[];

  const row = rows[0];
  return {
    all: row?.all ?? 0,
    low: row?.low ?? 0,
    out: row?.out ?? 0,
    in: row?.in ?? 0,
  };
}

/** Catalogue-wide units and cost valuation, ignoring list filters. */
export async function getInventoryValuationStats(): Promise<InventoryStats> {
  const { stats } = await queryInventory({ filter: "all", page: 1, pageSize: 1 });
  return stats;
}

export async function searchInventoryProducts(q: string, limit = 12): Promise<InventoryProductOption[]> {
  await connectToDatabase();
  const rx = searchableTerm(q);
  if (!rx) return [];
  const docs = (await Product.find({
    deletedAt: null,
    status: { $ne: "archived" },
    $or: [{ name: rx }, { sku: rx }, { barcode: rx }, { "variants.sku": rx }, { "variants.barcode": rx }],
  })
    .select("name sku barcode stock minStockLevel costPrice price images variants")
    .sort({ name: 1 })
    .limit(Math.min(20, Math.max(1, limit)))
    .lean()) as unknown as ProductLean[];

  return docs.map(toProductOption);
}

export async function getInventoryProduct(id: string): Promise<InventoryProductOption | null> {
  await ensureDb();
  if (!ID_PATTERN.test(id)) return null;
  const doc = (await Product.findOne({ _id: id, deletedAt: null, status: { $ne: "archived" } })
    .select("name sku barcode stock minStockLevel costPrice price images variants")
    .lean()) as ProductLean | null;
  if (!doc) return null;
  return toProductOption(doc);
}

function parseDay(value: string | undefined, end: boolean) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = end
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function readRef(value: unknown): { id: string | null; name: string | null } {
  if (!value || typeof value !== "object") {
    return { id: value ? String(value) : null, name: null };
  }
  const doc = value as { _id?: unknown; name?: string };
  return {
    id: doc._id ? String(doc._id) : null,
    name: doc.name ?? null,
  };
}

function mapMovement(doc: MovementLean): InventoryMovementRow {
  const product = readRef(doc.productId);
  const user = readRef(doc.performedBy);
  const created = doc.createdAt ? new Date(doc.createdAt) : null;
  return {
    id: String(doc._id),
    createdAt: created && !Number.isNaN(created.getTime()) ? created.toISOString() : "",
    sku: doc.sku,
    productId: product.id,
    productName: product.name ?? "Removed product",
    type: doc.type,
    quantityChange: doc.quantityChange,
    quantityBefore: doc.quantityBefore,
    quantityAfter: doc.quantityAfter,
    reason: doc.reason ?? null,
    notes: doc.notes ?? null,
    referenceType: doc.referenceType ?? null,
    referenceId: doc.referenceId ? String(doc.referenceId) : null,
    performedBy: user.name,
  };
}

export async function listInventoryMovements(params: {
  type?: string;
  types?: readonly string[];
  q?: string;
  from?: string;
  to?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
}) {
  await ensureDb();
  const { page, pageSize, skip } = pageWindow(params.page, params.pageSize);

  if (params.productId && !ID_PATTERN.test(params.productId)) {
    return { items: [] as InventoryMovementRow[], total: 0, page, pageSize, totalPages: 0 };
  }

  const filter: Record<string, unknown> = {};
  if (params.productId) filter.productId = new Types.ObjectId(params.productId);
  if (params.type && (INVENTORY_MOVEMENT_TYPES as readonly string[]).includes(params.type)) {
    filter.type = params.type;
  } else if (params.types?.length) {
    filter.type = { $in: [...params.types] };
  }

  const rx = searchableTerm(params.q);
  if (rx) {
    const products = await Product.find({
      $or: [{ name: rx }, { sku: rx }, { barcode: rx }, { "variants.sku": rx }],
    })
      .select("_id")
      .limit(200)
      .lean();
    filter.$or = [{ sku: rx }, { productId: { $in: products.map((product) => product._id) } }];
  }

  const from = parseDay(params.from, false);
  const to = parseDay(params.to, true);
  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.$gte = from;
    if (to) createdAt.$lte = to;
    filter.createdAt = createdAt;
  }

  const [docs, total] = await Promise.all([
    InventoryMovement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate({ path: "productId", select: "name", model: Product })
      .populate({ path: "performedBy", select: "name", model: User })
      .lean(),
    InventoryMovement.countDocuments(filter),
  ]);

  return {
    items: (docs as unknown as MovementLean[]).map(mapMovement),
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export async function listRecentAdjustments(limit = 12) {
  const result = await listInventoryMovements({
    types: ADJUSTABLE_MOVEMENT_TYPES,
    page: 1,
    pageSize: limit,
  });
  return result.items;
}
