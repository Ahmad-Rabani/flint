"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Package, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { PaymentMethod } from "@/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { formatTaxPercent, quotePosTotals, roundMoney } from "@/features/pos/pricing";
import type {
  PosCatalogItem,
  PosCustomerHit,
  PosReceipt,
  PosStockUpdate,
  PosTerminalData,
} from "@/features/pos/types";
import { PrintableReceipt } from "@/features/pos/components/printable-receipt";
import { PrintButton } from "@/features/pos/components/print-button";

type CartLine = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
};

const fieldClass =
  "h-12 w-full border border-[#171717]/15 bg-white px-3 text-base text-[#171717] outline-none placeholder:text-[#171717]/30 focus:border-copper";

function stockLabel(stock: number, minStockLevel: number) {
  if (stock <= 0) return "Out";
  if (stock <= minStockLevel) return `Low · ${stock}`;
  return `${stock}`;
}

function readMoney(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return roundMoney(amount);
}

export function PosTerminal({ data }: { data: PosTerminalData }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(data.items);
  const [categories, setCategories] = useState(data.categories);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<PosCustomerHit | null>(null);
  const [guestName, setGuestName] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerHits, setCustomerHits] = useState<PosCustomerHit[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(data.paymentMethods[0]?.id ?? "cash");
  const [discountText, setDiscountText] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [tenderedText, setTenderedText] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [receipt, setReceipt] = useState<PosReceipt | null>(null);

  const itemsRef = useRef(items);
  const cartRef = useRef(cart);

  useEffect(() => {
    itemsRef.current = items;
    cartRef.current = cart;
  }, [items, cart]);

  // Keep cart thumbnails in sync with catalog images (covers HMR / stale lines)
  useEffect(() => {
    setCart((current) => {
      let changed = false;
      const next = current.map((line) => {
        const fromCatalog = items.find((item) => item.key === line.key)?.imageUrl ?? null;
        if (!fromCatalog || line.imageUrl === fromCatalog) return line;
        changed = true;
        return { ...line, imageUrl: fromCatalog };
      });
      return changed ? next : current;
    });
  }, [items]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const term = customerQuery.trim();
    if (term.length < 1) return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/admin/pos/customers?q=${encodeURIComponent(term)}`);
          const body = (await response.json().catch(() => null)) as { items?: PosCustomerHit[] } | null;
          if (cancelled) return;
          setCustomerHits(response.ok ? (body?.items ?? []) : []);
        } catch {
          if (!cancelled) setCustomerHits([]);
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [customerQuery]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryId !== "all" && !item.categoryIds.includes(categoryId)) return false;
      if (!needle) return true;
      const haystack = `${item.displayName} ${item.sku} ${item.barcode ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, query, categoryId]);

  const discountAmount = data.canDiscount ? readMoney(discountText) : 0;
  const discountInvalid = data.canDiscount && discountText.trim() !== "" && discountAmount == null;
  const subtotal = cart.reduce((sum, line) => sum + roundMoney(line.unitPrice * line.quantity), 0);
  const overDiscount = data.canDiscount && discountAmount != null && discountAmount > subtotal;
  const quote = quotePosTotals({
    lines: cart,
    discountAmount: discountInvalid || overDiscount ? 0 : (discountAmount ?? 0),
    taxRate: data.taxRate,
    taxInclusive: data.taxInclusive,
  });
  const overStock = cart.some((line) => {
    const onHand = items.find((item) => item.key === line.key)?.stock ?? 0;
    return line.quantity > onHand;
  });
  const tendered = readMoney(tenderedText);
  const cashShort = paymentMethod === "cash" && (tendered == null || tendered < quote.total);

  function onHandFor(key: string) {
    return itemsRef.current.find((item) => item.key === key)?.stock ?? 0;
  }

  function imageFor(key: string, fallback?: string | null) {
    if (fallback) return fallback;
    return itemsRef.current.find((item) => item.key === key)?.imageUrl ?? null;
  }

  function addItem(item: PosCatalogItem) {
    const onHand = onHandFor(item.key);
    const existing = cartRef.current.find((line) => line.key === item.key);
    const nextQty = (existing?.quantity ?? 0) + 1;
    if (onHand <= 0 || nextQty > onHand) {
      toast.error(onHand <= 0 ? `${item.displayName} is out of stock` : `Only ${onHand} of ${item.displayName} are on hand`);
      return;
    }
    if (!existing && cartRef.current.length >= 100) {
      toast.error("This sale already has 100 lines");
      return;
    }
    const imageUrl = item.imageUrl || imageFor(item.key);
    setCart((current) => {
      const index = current.findIndex((line) => line.key === item.key);
      if (index === -1) {
        return [
          ...current,
          {
            key: item.key,
            productId: item.productId,
            variantId: item.variantId,
            name: item.displayName,
            sku: item.sku,
            imageUrl,
            unitPrice: item.price,
            quantity: 1,
          },
        ];
      }
      const next = current.slice();
      const line = next[index];
      if (!line) return current;
      next[index] = {
        ...line,
        quantity: line.quantity + 1,
        imageUrl: line.imageUrl || imageUrl,
      };
      return next;
    });
    setError(null);
  }

  function addFromSearch() {
    const needle = query.trim().toLowerCase();
    if (!needle) return;
    const exact = itemsRef.current.filter(
      (item) => item.sku.toLowerCase() === needle || item.barcode?.toLowerCase() === needle,
    );
    const match = exact.length === 1 ? exact[0] : filtered.length === 1 ? filtered[0] : null;
    if (!match) {
      toast.message(filtered.length === 0 ? "No product matches that code" : "Select a product from the grid");
      return;
    }
    addItem(match);
    setQuery("");
    searchRef.current?.focus();
  }

  function setQuantity(key: string, quantity: number) {
    const onHand = onHandFor(key);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setCart((current) => current.filter((line) => line.key !== key));
      return;
    }
    if (quantity > onHand) {
      toast.error(`Only ${onHand} are on hand`);
      return;
    }
    setCart((current) => current.map((line) => (line.key === key ? { ...line, quantity } : line)));
  }

  async function refreshCatalog() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/pos/catalog");
      const body = (await response.json().catch(() => null)) as
        | { items?: PosCatalogItem[]; categories?: PosTerminalData["categories"] }
        | null;
      if (!response.ok || !body?.items) {
        toast.error("Could not refresh stock");
        return;
      }
      setItems(body.items);
      if (body.categories) setCategories(body.categories);
    } catch {
      toast.error("Could not refresh stock");
    } finally {
      setRefreshing(false);
    }
  }

  function newSale() {
    setReceipt(null);
    setCart([]);
    setQuery("");
    setDiscountText("");
    setDiscountReason("");
    setTenderedText("");
    setNotes("");
    setGuestName("");
    setCustomer(null);
    setCustomerQuery("");
    setCustomerHits([]);
    setError(null);
    void refreshCatalog();
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }

  async function completeSale() {
    if (submitting || cart.length === 0) return;
    if (overStock) {
      setError("A line exceeds on-hand stock. Reduce the quantity and try again.");
      return;
    }
    if (discountInvalid) {
      setError("Enter a valid discount amount");
      return;
    }
    if (overDiscount) {
      setError("Discount cannot exceed the subtotal");
      return;
    }
    if (paymentMethod === "cash" && (tendered == null || tendered < quote.total)) {
      setError("Enter a cash amount that covers the total");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
          })),
          customerId: customer?.id ?? null,
          guestName: customer ? null : guestName.trim() || null,
          paymentMethod,
          discountAmount: data.canDiscount ? (discountAmount ?? 0) : 0,
          discountReason: data.canDiscount && (discountAmount ?? 0) > 0 ? discountReason.trim() || null : null,
          amountTendered: paymentMethod === "cash" ? tendered : null,
          notes: notes.trim() || null,
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string; receipt?: PosReceipt; stock?: PosStockUpdate[] }
        | null;
      if (!response.ok || !body?.receipt) {
        setError(body?.error || "Sale could not be completed");
        return;
      }
      if (Array.isArray(body.stock)) {
        const updates = body.stock;
        setItems((current) =>
          current.map((item) => {
            const update = updates.find(
              (row) => row.productId === item.productId && (row.variantId ?? null) === (item.variantId ?? null),
            );
            return update ? { ...item, stock: update.stock } : item;
          }),
        );
      }
      setCart([]);
      setReceipt(body.receipt);
      toast.success(`Sale ${body.receipt.receiptNumber} completed`);
    } catch {
      setError("Sale could not be completed. Check the connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const quickCash = useMemo(() => {
    if (quote.total <= 0) return [0];
    const bills = [5, 10, 20, 50, 100];
    const values = [quote.total, ...bills.map((bill) => Math.ceil(quote.total / bill) * bill)];
    return values
      .map((value) => roundMoney(value))
      .filter((value, index, all) => value >= quote.total && all.indexOf(value) === index)
      .slice(0, 4);
  }, [quote.total]);

  if (receipt) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f3ee]">
        <header className="no-print flex shrink-0 items-center justify-between border-b border-[#171717]/10 bg-white px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-copper">Sale complete</p>
            <h1 className="font-heading text-3xl text-[#171717]">{receipt.receiptNumber}</h1>
          </div>
          <p className="text-sm text-[#171717]/50">{data.cashierName}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8">
          <PrintableReceipt receipt={receipt} />
          <div className="no-print mx-auto mt-6 flex max-w-md flex-wrap gap-3">
            <PrintButton />
            <button
              type="button"
              onClick={newSale}
              className="inline-flex min-h-11 items-center border border-[#171717]/20 px-5 text-sm text-[#171717] hover:border-copper hover:text-copper"
            >
              New Sale
            </button>
            <Link
              href={`/admin/pos/sales/${receipt.id}`}
              className="inline-flex min-h-11 items-center px-2 text-sm text-copper"
            >
              Open receipt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f3ee]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#171717]/10 bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-copper">Register</p>
          <h1 className="font-heading text-3xl leading-none text-[#171717]">POS</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-11 items-center bg-[#171717] px-4 text-sm text-ivory">Checkout</span>
          <Link href="/admin/pos/sales" className="inline-flex min-h-11 items-center border border-[#171717]/15 px-4 text-sm text-[#171717]/70 hover:border-copper hover:text-copper">
            Sales
          </Link>
          <Link href="/admin/pos/refunds" className="inline-flex min-h-11 items-center border border-[#171717]/15 px-4 text-sm text-[#171717]/70 hover:border-copper hover:text-copper">
            Refunds
          </Link>
        </nav>
        <p className="text-sm text-[#171717]/50">{data.cashierName}</p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] md:grid-cols-[minmax(0,1.35fr)_minmax(24rem,0.65fr)] md:grid-rows-1">
        <section className="flex min-h-0 flex-col gap-3 bg-[#f0ebe3] p-4">
          <div className="relative shrink-0">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#171717]/40" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addFromSearch();
                }
              }}
              placeholder="Search name, SKU, or barcode"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 w-full border border-[#171717]/12 bg-white pl-11 pr-3 text-base text-[#171717] outline-none placeholder:text-[#171717]/35 focus:border-copper"
              aria-label="Search products"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex shrink-0 gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setCategoryId("all")}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center px-3.5 text-xs font-medium uppercase tracking-[0.12em] transition-colors",
                  categoryId === "all"
                    ? "bg-[#171717] text-ivory"
                    : "bg-white/80 text-[#171717]/65 hover:bg-white hover:text-[#171717]",
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center px-3.5 text-xs font-medium uppercase tracking-[0.12em] transition-colors",
                    categoryId === category.id
                      ? "bg-copper text-white"
                      : "bg-white/80 text-[#171717]/65 hover:bg-white hover:text-[#171717]",
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(23,23,23,0.25)_transparent]">
            {filtered.length === 0 ? (
              <div className="flex h-full min-h-40 items-center justify-center px-6 text-center text-sm text-[#171717]/45">
                {items.length === 0 ? "No active products are ready to sell." : "No products match that search."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => {
                  const inCart = cart.find((line) => line.key === item.key)?.quantity ?? 0;
                  const unavailable = item.stock <= 0;
                  const low = !unavailable && item.stock <= item.minStockLevel;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={unavailable}
                      onClick={() => addItem(item)}
                      className={cn(
                        "group relative flex min-h-[6.25rem] gap-3 overflow-hidden border border-[#171717]/10 bg-white p-2 text-left transition-all",
                        "hover:border-copper/50 hover:bg-[#fffdf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper",
                        "disabled:cursor-not-allowed disabled:opacity-40",
                        inCart > 0 && "border-copper ring-2 ring-copper/25",
                      )}
                    >
                      <div className="relative flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center overflow-hidden bg-[#f3efe8]">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <Package size={22} className="text-[#171717]/25" />
                        )}
                        {inCart > 0 && (
                          <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center bg-copper px-1 text-[10px] font-semibold text-white">
                            {inCart}
                          </span>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between py-1 pr-1">
                        <div>
                          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[#171717]">
                            {item.displayName}
                          </p>
                          <p className="mt-1 font-mono text-[10px] tracking-wide text-[#171717]/40">{item.sku}</p>
                        </div>
                        <div className="mt-2 flex items-end justify-between gap-2">
                          <span className="font-heading text-xl leading-none text-copper">
                            {formatCurrency(item.price, data.currency)}
                          </span>
                          <span
                            className={cn(
                              "rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
                              unavailable
                                ? "bg-red-50 text-red-700"
                                : low
                                  ? "bg-amber-50 text-amber-800"
                                  : "bg-[#171717]/05 text-[#171717]/50",
                            )}
                          >
                            {unavailable ? "Out" : `×${stockLabel(item.stock, item.minStockLevel)}`}
                          </span>
                        </div>
                      </div>

                      {item.ageRestriction > 0 && (
                        <span className="absolute bottom-2 right-2 bg-[#171717]/08 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-[#171717]/60">
                          {item.ageRestriction}+
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {refreshing && (
              <p className="py-2 text-center text-xs text-[#171717]/40">Updating stock…</p>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col border-t border-[#171717]/10 bg-[#faf8f4] md:border-l md:border-t-0">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#171717]/10 bg-white px-4 py-3.5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">Current sale</p>
              <p className="mt-0.5 text-sm text-[#171717]/60">
                {cart.reduce((sum, line) => sum + line.quantity, 0)}{" "}
                {cart.reduce((sum, line) => sum + line.quantity, 0) === 1 ? "item" : "items"}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCart([]);
                  setDiscountText("");
                  setDiscountReason("");
                  setTenderedText("");
                  setError(null);
                }}
                className="text-xs font-medium text-[#171717]/50 underline-offset-2 hover:text-copper hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Cart lines only — images first for fast recognition */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 px-4 text-center">
                <Package size={28} className="text-[#171717]/25" />
                <p className="text-sm text-[#171717]/50">Tap a product on the left to add it here.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {cart.map((line) => {
                  const thumb = imageFor(line.key, line.imageUrl);
                  return (
                    <li
                      key={line.key}
                      className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-stretch gap-3 border border-[#171717]/08 bg-white p-2"
                    >
                      <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden bg-[#f3efe8]">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={line.name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <Package size={20} className="text-[#171717]/25" />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-col justify-between py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-medium leading-snug text-[#171717]">
                              {line.name}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-[#171717]/40">{line.sku}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCart((current) => current.filter((entry) => entry.key !== line.key))
                            }
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[#171717]/35 hover:text-red-700"
                            aria-label={`Remove ${line.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center border border-[#171717]/15 bg-[#faf8f4]">
                            <button
                              type="button"
                              onClick={() => setQuantity(line.key, line.quantity - 1)}
                              className="inline-flex h-9 w-9 items-center justify-center text-[#171717]"
                              aria-label={`Decrease ${line.name}`}
                            >
                              <Minus size={13} />
                            </button>
                            <input
                              value={line.quantity}
                              onChange={(event) => {
                                const next = Number(event.target.value);
                                if (Number.isInteger(next)) setQuantity(line.key, next);
                              }}
                              inputMode="numeric"
                              aria-label={`Quantity for ${line.name}`}
                              className="h-9 w-10 border-x border-[#171717]/15 bg-transparent text-center text-sm text-[#171717] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setQuantity(line.key, line.quantity + 1)}
                              className="inline-flex h-9 w-9 items-center justify-center text-[#171717]"
                              aria-label={`Increase ${line.name}`}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-[#171717]">
                            {formatCurrency(roundMoney(line.unitPrice * line.quantity), data.currency)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {cart.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-[#171717]/10 pt-4">
                <div className="space-y-1 text-sm text-[#171717]">
                  <div className="flex justify-between text-[#171717]/65">
                    <span>Subtotal</span>
                    <span>{formatCurrency(quote.subtotal, data.currency)}</span>
                  </div>
                  {data.canDiscount && (
                    <div className="space-y-2 py-1">
                      <label className="block text-[10px] font-medium uppercase tracking-[0.16em] text-[#171717]/55">
                        Discount
                        <input
                          value={discountText}
                          onChange={(event) => setDiscountText(event.target.value)}
                          inputMode="decimal"
                          placeholder="0.00"
                          className={cn(fieldClass, "mt-1.5 h-10")}
                        />
                      </label>
                      {(discountAmount ?? 0) > 0 && (
                        <input
                          value={discountReason}
                          onChange={(event) => setDiscountReason(event.target.value)}
                          placeholder="Reason"
                          className={cn(fieldClass, "h-10")}
                        />
                      )}
                    </div>
                  )}
                  {quote.discountAmount > 0 && (
                    <div className="flex justify-between text-[#171717]/65">
                      <span>Discount</span>
                      <span>−{formatCurrency(quote.discountAmount, data.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#171717]/65">
                    <span>
                      {data.taxInclusive ? "Tax included" : "Tax"} ({formatTaxPercent(data.taxRate)})
                    </span>
                    <span>{formatCurrency(quote.taxAmount, data.currency)}</span>
                  </div>
                  {overDiscount && <p className="text-sm text-red-700">Discount cannot exceed the subtotal.</p>}
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#171717]/55">Customer</p>
                  {customer ? (
                    <div className="flex min-h-11 items-center justify-between gap-3 border border-[#171717]/15 bg-white px-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#171717]">{customer.name}</p>
                        <p className="truncate text-xs text-[#171717]/45">{customer.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomer(null)}
                        className="inline-flex h-9 w-9 items-center justify-center text-[#171717]"
                        aria-label="Use walk-in guest"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        value={guestName}
                        onChange={(event) => setGuestName(event.target.value)}
                        placeholder="Walk-in Guest"
                        className={cn(fieldClass, "h-10")}
                        aria-label="Guest name"
                      />
                      <div className="relative">
                        <input
                          value={customerQuery}
                          onChange={(event) => {
                            const value = event.target.value;
                            setCustomerQuery(value);
                            setCustomerOpen(true);
                            if (!value.trim()) setCustomerHits([]);
                          }}
                          onFocus={() => setCustomerOpen(true)}
                          placeholder="Search customers"
                          className={cn(fieldClass, "h-10")}
                          aria-label="Search customers"
                        />
                        {customerOpen && customerQuery.trim() && (
                          <div className="absolute bottom-full z-10 mb-1 max-h-52 w-full overflow-auto border border-[#171717]/15 bg-white shadow-lg">
                            {customerHits.length === 0 ? (
                              <p className="px-3 py-3 text-sm text-[#171717]/50">No customers found.</p>
                            ) : (
                              customerHits.map((hit) => (
                                <button
                                  key={hit.id}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setCustomer(hit);
                                    setCustomerQuery("");
                                    setCustomerHits([]);
                                    setCustomerOpen(false);
                                    setGuestName("");
                                  }}
                                  className="flex min-h-11 w-full flex-col items-start justify-center px-3 py-2 text-left hover:bg-[#f6f3ee]"
                                >
                                  <span className="text-sm text-[#171717]">{hit.name}</span>
                                  <span className="text-xs text-[#171717]/50">{hit.email}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <label className="block text-[10px] font-medium uppercase tracking-[0.16em] text-[#171717]/55">
                  Notes
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={2}
                    placeholder="Optional note"
                    className="mt-1.5 w-full border border-[#171717]/15 bg-white px-3 py-2 text-sm text-[#171717] outline-none placeholder:text-[#171717]/30 focus:border-copper"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Sticky checkout: payment + cash + complete always in view */}
          <div className="shrink-0 space-y-3 border-t border-[#171717]/12 bg-white px-4 py-3.5 shadow-[0_-10px_30px_rgba(23,23,23,0.06)]">
            <div className="flex items-end justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#171717]/55">Total due</span>
              <span className="font-heading text-[2.35rem] leading-none text-[#171717]">
                {formatCurrency(quote.total, data.currency)}
              </span>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#171717]/55">Payment</p>
              <div className="grid grid-cols-4 gap-1.5">
                {data.paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method.id);
                      if (method.id !== "cash") setTenderedText("");
                      if (method.id === "cash" && quote.total > 0 && !tenderedText.trim()) {
                        setTenderedText(quote.total.toFixed(2));
                      }
                    }}
                    className={cn(
                      "h-10 border px-1 text-[11px] font-medium leading-tight",
                      paymentMethod === method.id
                        ? "border-[#171717] bg-[#171717] text-ivory"
                        : "border-[#171717]/20 bg-[#faf8f4] text-[#171717] hover:border-[#171717]/45",
                    )}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && cart.length > 0 && (
              <div>
                <div className="flex items-center gap-2">
                  <input
                    value={tenderedText}
                    onChange={(event) => setTenderedText(event.target.value)}
                    inputMode="decimal"
                    placeholder="Cash received"
                    aria-label="Amount tendered"
                    className="h-11 flex-1 border border-[#171717]/20 bg-[#faf8f4] px-3 text-sm text-[#171717] outline-none placeholder:text-[#171717]/35 focus:border-copper"
                  />
                  <button
                    type="button"
                    onClick={() => setTenderedText(quote.total.toFixed(2))}
                    className="h-11 shrink-0 border border-[#171717]/20 px-3 text-xs font-medium uppercase tracking-wide text-[#171717] hover:border-copper hover:text-copper"
                  >
                    Exact
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {quickCash.filter((amount) => amount !== quote.total).map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTenderedText(amount.toFixed(2))}
                      className="inline-flex h-8 items-center border border-[#171717]/12 bg-[#faf8f4] px-2.5 text-xs text-[#171717] hover:border-copper"
                    >
                      {formatCurrency(amount, data.currency)}
                    </button>
                  ))}
                </div>
                {tendered != null && tendered >= quote.total && quote.total > 0 && (
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#171717]/55">Change</span>
                    <span className="font-heading text-2xl text-copper">
                      {formatCurrency(roundMoney(tendered - quote.total), data.currency)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            {!error && cart.length === 0 && (
              <p className="text-xs text-[#171717]/50">Add products to enable checkout.</p>
            )}
            {!error && cart.length > 0 && cashShort && (
              <p className="text-xs text-amber-800">Enter cash received that covers the total.</p>
            )}
            {!error && overStock && (
              <p className="text-xs text-red-700">A quantity exceeds on-hand stock.</p>
            )}

            <button
              type="button"
              disabled={submitting || cart.length === 0 || overStock || discountInvalid || overDiscount || cashShort}
              onClick={() => void completeSale()}
              className={cn(
                "flex h-[3.75rem] w-full flex-col items-center justify-center gap-0.5 transition-colors",
                cart.length > 0 && !cashShort && !overStock && !discountInvalid && !overDiscount
                  ? "bg-copper text-white hover:bg-[#e05f00]"
                  : "bg-[#171717] text-ivory disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              <span className="text-[15px] font-semibold tracking-wide">
                {submitting ? "Completing sale…" : "Complete Sale"}
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] opacity-85">
                {submitting ? "Please wait" : "Issue receipt"}
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
