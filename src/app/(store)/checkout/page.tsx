"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCartStore } from "@/features/cart/store";
import { formatCurrency } from "@/lib/utils";
import { addressSchema } from "@/lib/validation/checkout";
import { PAYMENT_METHODS } from "@/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const checkoutFormSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "other"]),
  notes: z.string().optional(),
  ageConfirmed: z.boolean().optional(),
  couponCode: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

const paymentLabels: Record<(typeof PAYMENT_METHODS)[number], string> = {
  cash: "Cash on arrangement",
  card: "Card payment",
  bank_transfer: "Bank transfer",
  other: "Other arranged method",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clearCart, total } = useCartStore();
  const subtotal = total();
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shippingEstimate = subtotal - discount >= 250 ? 0 : 15;
  const taxEstimate = Math.round((Math.max(subtotal - discount, 0) * 0.08) * 100) / 100;
  const grandTotal = Math.round((Math.max(subtotal - discount, 0) + taxEstimate + shippingEstimate) * 100) / 100;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: "",
      phone: "",
      paymentMethod: "bank_transfer",
      ageConfirmed: false,
      shippingAddress: {
        fullName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
      },
      notes: "",
    },
  });

  const empty = lines.length === 0;

  const summaryLines = useMemo(() => lines, [lines]);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput.trim(), subtotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Coupon could not be applied");
      setDiscount(0);
      setAppliedCoupon(null);
      return;
    }
    setDiscount(data.discount);
    setAppliedCoupon(data.code);
    form.setValue("couponCode", data.code);
    toast.success(`Coupon ${data.code} applied`);
  }

  async function onSubmit(values: CheckoutFormValues) {
    if (empty) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          billingSameAsShipping: true,
          couponCode: appliedCoupon || undefined,
          items: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
            customization: line.customization,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Checkout failed");
        return;
      }
      clearCart();
      router.push(`/order-confirmation/${data.order.orderNumber}`);
    } catch {
      toast.error("Unable to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (empty) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-28 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-copper">Checkout</p>
        <h1 className="mt-3 font-heading text-4xl text-ink">Your cart is empty</h1>
        <Link
          href="/catalogue"
          className="mt-8 inline-flex h-12 items-center bg-ink px-8 text-xs uppercase tracking-[0.2em] text-ivory"
        >
          Browse catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="border-b border-border/70 bg-ivory">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-xs uppercase tracking-[0.25em] text-copper">Checkout</p>
          <h1 className="mt-3 font-heading text-4xl md:text-5xl text-ink">Complete your order</h1>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:px-10"
      >
        <div className="space-y-10">
          <section className="space-y-5">
            <h2 className="font-heading text-2xl text-ink">Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="font-heading text-2xl text-ink">Shipping</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Full name</Label>
                <Input {...form.register("shippingAddress.fullName")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Phone</Label>
                <Input {...form.register("shippingAddress.phone")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input {...form.register("shippingAddress.line1")} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Apartment, suite (optional)</Label>
                <Input {...form.register("shippingAddress.line2")} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...form.register("shippingAddress.city")} />
              </div>
              <div className="space-y-2">
                <Label>State / Province</Label>
                <Input {...form.register("shippingAddress.state")} />
              </div>
              <div className="space-y-2">
                <Label>Postal code</Label>
                <Input {...form.register("shippingAddress.postalCode")} />
              </div>
              <div className="space-y-2">
                <Label>Country (ISO)</Label>
                <Input {...form.register("shippingAddress.country")} placeholder="US" />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="font-heading text-2xl text-ink">Payment method</h2>
            <p className="text-sm text-muted-foreground">
              Payment gateways are configurable. Select your preferred method — staff will confirm
              settlement details for your order.
            </p>
            <div className="grid gap-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method}
                  className="flex cursor-pointer items-center gap-3 border border-border bg-white px-4 py-3"
                >
                  <input
                    type="radio"
                    value={method}
                    {...form.register("paymentMethod")}
                    className="accent-[var(--copper)]"
                  />
                  <span className="text-sm text-ink">{paymentLabels[method]}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-2xl text-ink">Notes</h2>
            <Textarea
              rows={4}
              placeholder="Delivery preferences, engraving notes, etc."
              {...form.register("notes")}
            />
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox
                checked={!!form.watch("ageConfirmed")}
                onCheckedChange={(v) => form.setValue("ageConfirmed", Boolean(v))}
              />
              I confirm I meet any age requirements for restricted blades in this order.
            </label>
          </section>
        </div>

        <aside className="h-fit border border-border bg-white p-6 lg:sticky lg:top-28">
          <h2 className="font-heading text-2xl text-ink">Order summary</h2>
          <ul className="mt-6 space-y-4">
            {summaryLines.map((line) => (
              <li key={`${line.productId}-${line.variantId ?? ""}`} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 bg-muted">
                  {line.image ? (
                    <Image src={line.image} alt={line.name} fill className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{line.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {line.quantity}</p>
                </div>
                <p className="text-sm text-ink">{formatCurrency(line.price * line.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex gap-2">
            <Input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Coupon code"
            />
            <Button type="button" variant="outline" className="rounded-none" onClick={applyCoupon}>
              Apply
            </Button>
          </div>
          {appliedCoupon && (
            <p className="mt-2 text-xs text-copper">Applied: {appliedCoupon}</p>
          )}

          <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>-{formatCurrency(discount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estimated tax</dt>
              <dd>{formatCurrency(taxEstimate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shippingEstimate === 0 ? "Free" : formatCurrency(shippingEstimate)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base text-ink">
              <dt className="font-medium">Total</dt>
              <dd className="font-medium">{formatCurrency(grandTotal)}</dd>
            </div>
          </dl>

          <Button
            type="submit"
            disabled={submitting}
            className="mt-6 h-12 w-full rounded-none bg-copper text-white hover:bg-copper/90"
          >
            {submitting ? "Placing order…" : "Place order"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            You will receive order details and payment instructions after placement.
          </p>
        </aside>
      </form>
    </div>
  );
}
