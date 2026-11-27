import { formatCurrency } from "@/lib/utils";
import { formatTaxPercent, PAYMENT_LABELS } from "@/features/pos/pricing";
import type { PosReceipt } from "@/features/pos/types";

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PrintableReceipt({ receipt }: { receipt: PosReceipt }) {
  const money = (amount: number) => formatCurrency(amount, receipt.currency);

  return (
    <>
      <style>{`
        @media print {
          aside, .fixed, .no-print { display: none !important; }
          main {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          #pos-receipt {
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page { margin: 12mm; }
        }
      `}</style>
      <article id="pos-receipt" className="mx-auto w-full max-w-md border border-[#171717]/10 bg-white px-6 py-8 text-[#171717] shadow-sm">
        <p className="text-[10px] uppercase tracking-[0.35em] text-copper">FLINT</p>
        <h2 className="mt-2 font-heading text-3xl">{receipt.businessName}</h2>
        {receipt.businessAddress && (
          <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[#171717]/55">{receipt.businessAddress}</p>
        )}

        <div className="mt-6 border-t border-dashed border-[#171717]/15 pt-4 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-xs uppercase tracking-[0.18em] text-[#171717]/45">Receipt</span>
            <span className="font-medium">{receipt.receiptNumber}</span>
          </div>
          <div className="mt-2 flex justify-between gap-4 text-xs text-[#171717]/60">
            <span>{formatWhen(receipt.createdAt)}</span>
            <span className="capitalize">{receipt.status}</span>
          </div>
          <p className="mt-3 text-sm">
            <span className="text-[#171717]/45">Cashier </span>
            {receipt.cashierName}
          </p>
          <p className="mt-1 text-sm">
            <span className="text-[#171717]/45">Customer </span>
            {receipt.customerName}
          </p>
          {receipt.orderNumber && (
            <p className="mt-1 text-xs text-[#171717]/45">Order {receipt.orderNumber}</p>
          )}
        </div>

        <div className="mt-5 border-t border-dashed border-[#171717]/15 pt-4">
          {receipt.items.length === 0 ? (
            <p className="text-sm text-[#171717]/45">No lines on this receipt.</p>
          ) : (
            <ul className="space-y-3">
              {receipt.items.map((item, index) => (
                <li key={`${item.sku}-${index}`} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#171717]/40">
                      {item.sku} · {item.quantity} × {money(item.unitPrice)}
                    </p>
                  </div>
                  <p className="shrink-0">{money(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <dl className="mt-5 space-y-1.5 border-t border-dashed border-[#171717]/15 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#171717]/55">Subtotal</dt>
            <dd>{money(receipt.subtotal)}</dd>
          </div>
          {receipt.discountAmount > 0 && (
            <div className="flex justify-between">
              <dt className="text-[#171717]/55">
                Discount{receipt.discountReason ? ` · ${receipt.discountReason}` : ""}
              </dt>
              <dd>−{money(receipt.discountAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-[#171717]/55">
              {receipt.taxInclusive ? "Tax included" : "Tax"} ({formatTaxPercent(receipt.taxRate)})
            </dt>
            <dd>{money(receipt.taxAmount)}</dd>
          </div>
          <div className="flex items-end justify-between pt-2">
            <dt className="text-xs uppercase tracking-[0.18em] text-[#171717]/45">Total</dt>
            <dd className="font-heading text-3xl">{money(receipt.total)}</dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-dashed border-[#171717]/15 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[#171717]/55">Payment</span>
            <span>{receipt.paymentLabel || PAYMENT_LABELS[receipt.paymentMethod]}</span>
          </div>
          {receipt.amountTendered != null && (
            <div className="mt-1.5 flex justify-between">
              <span className="text-[#171717]/55">Tendered</span>
              <span>{money(receipt.amountTendered)}</span>
            </div>
          )}
          {receipt.changeGiven != null && (
            <div className="mt-1.5 flex justify-between">
              <span className="text-[#171717]/55">Change</span>
              <span className="font-medium text-copper">{money(receipt.changeGiven)}</span>
            </div>
          )}
          {receipt.notes && <p className="mt-4 text-xs leading-5 text-[#171717]/55">{receipt.notes}</p>}
        </div>

        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.28em] text-[#171717]/35">Thank you</p>
      </article>
    </>
  );
}
