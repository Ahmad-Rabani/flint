"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ADJUSTABLE_MOVEMENT_TYPES,
  movementTypeLabel,
  type AdjustableMovementType,
  type AdjustStockResult,
  type InventoryProductOption,
} from "@/features/inventory/types";

type Props = {
  initialProduct: InventoryProductOption | null;
  initialVariantId?: string;
};

const inputCls =
  "w-full border border-[#1B365D]/20 bg-white px-3 py-2 text-sm text-[#1B365D] placeholder:text-[#1B365D]/30 focus:border-copper focus:outline-none";
const labelCls = "block text-xs uppercase tracking-widest text-[#1B365D]/50 mb-1.5";

function startingVariant(product: InventoryProductOption | null, variantId?: string) {
  if (!product) return "";
  if (variantId && product.variants.some((variant) => variant.id === variantId)) return variantId;
  if (product.variants.length === 1) return product.variants[0].id;
  return "";
}

export function AdjustmentForm({ initialProduct, initialVariantId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InventoryProductOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<InventoryProductOption | null>(initialProduct);
  const [variantId, setVariantId] = useState(startingVariant(initialProduct, initialVariantId));
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<AdjustableMovementType>("adjustment");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [allowZero, setAllowZero] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 1) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const res = await fetch(`/api/admin/inventory/products?q=${encodeURIComponent(term)}`, {
            signal: controller.signal,
          });
          const data = (await res.json()) as { items?: InventoryProductOption[]; error?: string };
          if (!res.ok) throw new Error(data.error ?? "Search failed");
          if (!controller.signal.aborted) setResults(data.items ?? []);
        } catch (error) {
          if ((error as Error).name === "AbortError" || controller.signal.aborted) return;
          setResults([]);
          toast.error(error instanceof Error ? error.message : "Search failed");
        } finally {
          if (!controller.signal.aborted) setSearching(false);
        }
      })();
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const selectedVariant = selected?.variants.find((variant) => variant.id === variantId) ?? null;
  const tracksVariants = (selected?.variants.length ?? 0) > 0;
  const onHand = !selected ? null : tracksVariants ? (selectedVariant?.stock ?? null) : selected.stock;
  const delta = Number(quantity);
  const validDelta = quantity.trim() !== "" && Number.isInteger(delta) && delta !== 0;
  const projected = onHand != null && validDelta ? onHand + delta : null;
  const canClamp = type === "damage" && allowZero && delta < 0 && onHand != null && onHand > 0;
  const willClamp = canClamp && projected != null && projected < 0;
  const nextStock = willClamp ? 0 : projected;
  const goesNegative = projected != null && projected < 0 && !willClamp;

  let hint: string | null = null;
  if (selected && tracksVariants && !variantId) {
    hint = "Choose a variant. Stock is tracked per variant.";
  } else if (quantity.trim() && !validDelta) {
    hint = "Enter a non-zero whole number. Positive adds stock, negative removes it.";
  } else if (goesNegative) {
    hint =
      onHand === 0
        ? "Already out of stock."
        : "That would take stock below zero. A damage write-off can zero the remaining stock instead.";
  } else if (reason.trim().length > 0 && reason.trim().length < 2) {
    hint = "Add a short reason.";
  }

  const canSubmit =
    !pending &&
    !!selected &&
    (!tracksVariants || !!variantId) &&
    validDelta &&
    reason.trim().length >= 2 &&
    !goesNegative;

  function pick(product: InventoryProductOption) {
    setSelected(product);
    setVariantId(product.variants.length === 1 ? product.variants[0].id : "");
    setQuery("");
    setResults([]);
    setAllowZero(false);
  }

  async function handleSubmit() {
    if (!selected || !canSubmit) return;
    setPending(true);
    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selected.id,
          variantId: variantId || undefined,
          quantityChange: delta,
          type,
          reason: reason.trim(),
          notes: notes.trim() || undefined,
          allowZeroWriteOff: type === "damage" && allowZero,
        }),
      });
      const result = (await res.json()) as AdjustStockResult & { error?: string };
      if (!res.ok) throw new Error(result.error ?? "Adjustment failed");

      const signed =
        result.quantityChange > 0 ? `+${result.quantityChange}` : String(result.quantityChange);
      toast.success(
        result.clamped
          ? `${result.sku} written off to zero (${result.quantityBefore} → 0)`
          : `${result.sku} updated ${signed} (${result.quantityBefore} → ${result.quantityAfter})`,
      );

      setSelected((current) => {
        if (!current) return current;
        if (result.variantId) {
          return {
            ...current,
            variants: current.variants.map((variant) =>
              variant.id === result.variantId ? { ...variant, stock: result.quantityAfter } : variant,
            ),
          };
        }
        return { ...current, stock: result.quantityAfter };
      });
      setQuantity("");
      setReason("");
      setNotes("");
      setAllowZero(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Adjustment failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
      className="border border-[#1B365D]/10 bg-white p-5"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative lg:col-span-2">
          <label className={labelCls} htmlFor="inventory-product-search">
            Product
          </label>
          <input
            id="inventory-product-search"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              if (!value.trim()) {
                setResults([]);
                setSearching(false);
              }
            }}
            placeholder="Search by name, SKU, or barcode"
            autoComplete="off"
            className={inputCls}
          />
          {searching && <p className="mt-1.5 text-xs text-[#1B365D]/40">Searching…</p>}
          {query.trim() && !searching && results.length === 0 && (
            <p className="mt-1.5 text-xs text-[#1B365D]/40">No matching products.</p>
          )}
          {results.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-[#1B365D]/15 bg-white shadow-sm">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => pick(product)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-[#F6F3EE]"
                  >
                    <span>
                      <span className="text-[#1B365D]">{product.name}</span>
                      <span className="ml-2 font-mono text-xs text-[#1B365D]/45">{product.sku}</span>
                    </span>
                    <span className="shrink-0 text-xs text-[#1B365D]/50">
                      {product.variants.length > 0
                        ? `${product.variants.length} variants`
                        : `${product.stock} on hand`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div className="lg:col-span-2 flex flex-wrap items-start justify-between gap-3 border border-[#1B365D]/10 bg-[#F6F3EE] px-4 py-3">
            <div>
              <p className="font-medium text-[#1B365D]">{selected.name}</p>
              <p className="mt-1 font-mono text-xs text-[#1B365D]/55">
                {selected.sku}
                {selected.barcode ? ` · ${selected.barcode}` : ""}
              </p>
              {!tracksVariants && (
                <p className="mt-1 text-sm text-[#1B365D]/70">{selected.stock} on hand</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setVariantId("");
              }}
              className="text-xs text-copper hover:text-copper/80"
            >
              Change product
            </button>
          </div>
        )}

        {selected && tracksVariants && (
          <div className="lg:col-span-2">
            <label className={labelCls} htmlFor="inventory-variant">
              Variant
            </label>
            <select
              id="inventory-variant"
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
              className={inputCls}
            >
              <option value="">Select a variant</option>
              {selected.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name} · {variant.sku} · {variant.stock} on hand
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelCls} htmlFor="inventory-qty">
            Quantity change
          </label>
          <input
            id="inventory-qty"
            type="number"
            step={1}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="+10 or -2"
            className={inputCls}
          />
          <p className="mt-1.5 text-xs text-[#1B365D]/40">Positive receives stock. Negative removes it.</p>
        </div>

        <div>
          <label className={labelCls} htmlFor="inventory-type">
            Type
          </label>
          <select
            id="inventory-type"
            value={type}
            onChange={(event) => setType(event.target.value as AdjustableMovementType)}
            className={inputCls}
          >
            {ADJUSTABLE_MOVEMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {movementTypeLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className={labelCls} htmlFor="inventory-reason">
            Reason
          </label>
          <input
            id="inventory-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Cycle count, supplier receipt, broken blade…"
            className={inputCls}
            maxLength={500}
          />
        </div>

        <div className="lg:col-span-2">
          <label className={labelCls} htmlFor="inventory-notes">
            Notes
          </label>
          <textarea
            id="inventory-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Optional detail for the movement log"
            className={inputCls}
            maxLength={2000}
          />
        </div>
      </div>

      {type === "damage" && projected != null && projected < 0 && onHand != null && onHand > 0 && (
        <label className="mt-4 flex items-start gap-2 text-sm text-[#1B365D]/75">
          <input
            type="checkbox"
            checked={allowZero}
            onChange={(event) => setAllowZero(event.target.checked)}
            className="mt-1 accent-[#1B365D]"
          />
          <span>
            Zero remaining stock. {onHand} on hand cannot cover a removal of {Math.abs(delta)}, so this
            writes the balance off to zero.
          </span>
        </label>
      )}

      {nextStock != null && !goesNegative && (
        <p className="mt-4 text-sm text-[#1B365D]/70">
          On hand <span className="font-medium text-[#1B365D]">{onHand}</span>
          {" → "}
          <span className={cn("font-medium", nextStock === 0 ? "text-red-700" : "text-[#1B365D]")}>
            {nextStock}
          </span>
          {willClamp && <span className="text-[#1B365D]/50"> · writes off {onHand}</span>}
        </p>
      )}

      {hint && <p className="mt-4 text-sm text-red-700">{hint}</p>}

      <div className="mt-5">
        <button
          type="submit"
          disabled={!canSubmit}
          className="border border-[#1B365D] bg-[#1B365D] px-4 py-2 text-sm text-ivory transition-colors hover:bg-[#1B365D]/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Saving…" : "Apply adjustment"}
        </button>
      </div>
    </form>
  );
}
