"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PlainCustomizationOption } from "@/features/custom-orders/queries";
import type { StyleEntry } from "@/features/custom-orders/catalog";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductType = "knife" | "axe" | "utility";

type UploadedImage = {
  id: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  alt: string;
  localPreview?: string;
};

type WizardState = {
  productType: ProductType | null;
  designStyle: string | null;
  preferences: Record<string, string>;
  referenceImages: UploadedImage[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  intendedUse: string;
  budgetMin: string;
  budgetMax: string;
  preferredDeliveryDate: string;
  additionalComments: string;
};

type Props = {
  stylesMap: Record<string, StyleEntry[]>;
  options: PlainCustomizationOption[];
  initialSession: { name: string; email: string } | null;
};

const STEPS = [
  { id: 1, label: "Product" },
  { id: 2, label: "Style" },
  { id: 3, label: "Details" },
  { id: 4, label: "References" },
  { id: 5, label: "Contact" },
  { id: 6, label: "Review" },
];

const PRODUCT_TYPES: Array<{
  type: ProductType;
  label: string;
  sub: string;
  image: string;
  alt: string;
}> = [
  {
    type: "knife",
    label: "Knife",
    sub: "Chef · Gyuto · Hunter · Fillet",
    image: "/images/products/tracker-hunter.jpg",
    alt: "Hand-forged hunting knife with leather sheath",
  },
  {
    type: "axe",
    label: "Axe",
    sub: "Hatchet · Viking · Carving · Camp",
    image: "/images/products/skinner.jpg",
    alt: "Hand-forged camp axe with leather sheath",
  },
  {
    type: "utility",
    label: "Utility",
    sub: "EDC · Workshop · Field · Bushcraft",
    image: "/images/products/folding-blue.jpg",
    alt: "Utility folding blade with sheath",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function CustomDesignerWizard({ stylesMap, options, initialSession }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<WizardState>({
    productType: null,
    designStyle: null,
    preferences: {},
    referenceImages: [],
    customerName: initialSession?.name ?? "",
    customerEmail: initialSession?.email ?? "",
    customerPhone: "",
    description: "",
    intendedUse: "",
    budgetMin: "",
    budgetMax: "",
    preferredDeliveryDate: "",
    additionalComments: "",
  });

  // ─── Navigation ─────────────────────────────────────────────────────────

  function canAdvance(): boolean {
    if (step === 1) return state.productType !== null;
    if (step === 2) return state.designStyle !== null;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) {
      return (
        state.customerName.trim().length >= 2 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.customerEmail) &&
        state.description.trim().length >= 10
      );
    }
    return true;
  }

  function next() {
    if (canAdvance() && step < STEPS.length) setStep((s) => s + 1);
  }

  function back() {
    if (step > 1) setStep((s) => s - 1);
  }

  // ─── Upload ─────────────────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remaining = 8 - state.referenceImages.length;
      if (remaining <= 0) {
        toast.error("Maximum 8 reference images allowed");
        return;
      }
      const toUpload = Array.from(files).slice(0, remaining);

      // Build local previews immediately
      const previews: UploadedImage[] = toUpload.map((f, i) => ({
        id: `local_${Date.now()}_${i}`,
        key: "",
        url: "",
        mimeType: f.type,
        size: f.size,
        alt: f.name,
        localPreview: URL.createObjectURL(f),
      }));

      setState((s) => ({ ...s, referenceImages: [...s.referenceImages, ...previews] }));
      setUploadingCount((c) => c + toUpload.length);

      const fd = new FormData();
      fd.append("folder", "custom-orders");
      toUpload.forEach((f) => fd.append("files", f));

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Upload failed");
        }
        const data = (await res.json()) as { files?: UploadedImage[] };
        const uploaded = data.files ?? [];
        if (uploaded.length === 0) {
          throw new Error("Upload failed");
        }

        setState((s) => {
          const imgs = [...s.referenceImages];
          previews.forEach((p, i) => {
            const idx = imgs.findIndex((img) => img.id === p.id);
            const file = uploaded[i];
            if (idx === -1 || !file) return;
            // Keep blob preview until the server URL is confirmed loading;
            // never leave a revoked object URL as the only src.
            imgs[idx] = {
              ...file,
              id: file.id || p.id,
              alt: file.alt || p.alt,
              localPreview: p.localPreview,
            };
          });
          return { ...s, referenceImages: imgs };
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
        previews.forEach((p) => {
          if (p.localPreview) URL.revokeObjectURL(p.localPreview);
        });
        setState((s) => ({
          ...s,
          referenceImages: s.referenceImages.filter(
            (img) => !previews.some((p) => p.id === img.id),
          ),
        }));
      } finally {
        setUploadingCount((c) => Math.max(0, c - toUpload.length));
      }
    },
    [state.referenceImages.length],
  );

  function removeImage(id: string) {
    setState((s) => {
      const target = s.referenceImages.find((img) => img.id === id);
      if (target?.localPreview) URL.revokeObjectURL(target.localPreview);
      return {
        ...s,
        referenceImages: s.referenceImages.filter((img) => img.id !== id),
      };
    });
  }

  // ─── Submit ─────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        productType: state.productType,
        designStyle: state.designStyle,
        preferences: state.preferences,
        referenceImages: state.referenceImages
          .filter((img) => img.key)
          .map((img) => ({ key: img.key, url: img.url, alt: img.alt, mimeType: img.mimeType, size: img.size })),
        customerName: state.customerName,
        customerEmail: state.customerEmail,
        customerPhone: state.customerPhone || undefined,
        description: state.description,
        intendedUse: state.intendedUse || undefined,
        budgetMin: state.budgetMin ? Number(state.budgetMin) : undefined,
        budgetMax: state.budgetMax ? Number(state.budgetMax) : undefined,
        preferredDeliveryDate: state.preferredDeliveryDate || undefined,
        additionalComments: state.additionalComments || undefined,
      };

      const res = await fetch("/api/custom-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");

      router.push(`/custom/confirmation/${data.orderNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit order");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#120e0b] pt-[4.25rem] lg:pt-[4.75rem]">
      {/* Progress bar */}
      <div className="sticky top-[4.25rem] z-30 border-b border-white/10 bg-[#120e0b]/95 backdrop-blur lg:top-[4.75rem]">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <span className="font-heading text-[10px] uppercase tracking-[0.28em] text-copper sm:text-xs">
              Custom Commission
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/40 sm:text-xs">
              Step {step} of {STEPS.length}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => step > s.id && setStep(s.id)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center text-xs font-medium transition-all",
                    step === s.id
                      ? "bg-copper text-white"
                      : step > s.id
                        ? "cursor-pointer bg-copper/20 text-copper hover:bg-copper/30"
                        : "bg-white/10 text-white/30",
                  )}
                >
                  {step > s.id ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    s.id
                  )}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-px flex-1 transition-all",
                      step > s.id ? "bg-copper/40" : "bg-white/10",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex">
            {STEPS.map((s) => (
              <div key={s.id} className="flex-1 text-center">
                <span
                  className={cn(
                    "text-[9px] uppercase tracking-widest sm:text-[10px]",
                    step === s.id ? "text-copper" : step > s.id ? "text-white/40" : "text-white/20",
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-14 lg:px-10">
        {step === 1 && (
          <Step1ProductType
            value={state.productType}
            onChange={(v) => setState((s) => ({ ...s, productType: v, designStyle: null }))}
          />
        )}
        {step === 2 && (
          <Step2Style
            styles={stylesMap[state.productType ?? "knife"] ?? []}
            value={state.designStyle}
            onChange={(v) => setState((s) => ({ ...s, designStyle: v }))}
          />
        )}
        {step === 3 && (
          <Step3Preferences
            options={options.filter(
              (o) => !state.productType || o.productTypes.includes(state.productType),
            )}
            values={state.preferences}
            onChange={(k, v) =>
              setState((s) => ({ ...s, preferences: { ...s.preferences, [k]: v } }))
            }
          />
        )}
        {step === 4 && (
          <Step4Images
            images={state.referenceImages}
            uploadingCount={uploadingCount}
            fileInputRef={fileInputRef}
            onFiles={handleFiles}
            onRemove={removeImage}
          />
        )}
        {step === 5 && (
          <Step5Contact
            values={state}
            onChange={(field, value) => setState((s) => ({ ...s, [field]: value }))}
          />
        )}
        {step === 6 && (
          <Step6Review
            state={state}
            styles={stylesMap[state.productType ?? "knife"] ?? []}
            options={options}
            onEdit={(s) => setStep(s)}
          />
        )}

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-8 md:mt-14">
          <button
            type="button"
            onClick={back}
            className={cn(
              "cursor-pointer px-6 py-3 text-xs uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white",
              step === 1 && "invisible",
            )}
          >
            ← Back
          </button>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              className={cn(
                "relative overflow-hidden bg-copper px-10 py-4 text-xs uppercase tracking-[0.25em] text-white transition-all",
                canAdvance()
                  ? "cursor-pointer hover:bg-[#c97d58] active:scale-[0.98]"
                  : "cursor-not-allowed opacity-40",
              )}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || uploadingCount > 0}
              className={cn(
                "relative overflow-hidden bg-copper px-12 py-4 text-xs uppercase tracking-[0.25em] text-white transition-all",
                !submitting && uploadingCount === 0
                  ? "cursor-pointer hover:bg-[#c97d58] active:scale-[0.98]"
                  : "cursor-not-allowed opacity-60",
              )}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting…
                </span>
              ) : uploadingCount > 0 ? (
                "Uploading images…"
              ) : (
                "Submit Commission →"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Product Type ─────────────────────────────────────────────────────

function Step1ProductType({
  value,
  onChange,
}: {
  value: ProductType | null;
  onChange: (v: ProductType) => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
            Step 1 · Product
          </p>
          <div className="editorial-rule mb-5 mt-4" />
          <h2 className="max-w-[14ch] font-heading text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.05] text-ivory">
            What are you commissioning?
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-ivory/50 md:pb-1">
          Choose the blade form at the heart of your commission. Every detail follows from here.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5 md:mt-12">
        {PRODUCT_TYPES.map((pt) => {
          const selected = value === pt.type;
          return (
            <button
              key={pt.type}
              type="button"
              onClick={() => onChange(pt.type)}
              aria-pressed={selected}
              className={cn(
                "group relative flex cursor-pointer flex-col overflow-hidden border text-left transition-all duration-300",
                selected
                  ? "border-copper ring-1 ring-copper/50"
                  : "border-white/12 hover:border-white/35",
              )}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2a221c]">
                {/* Real product photo — never emoji / SVG icons */}
                <Image
                  src={pt.image}
                  alt={pt.alt}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 33vw"
                  quality={92}
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/10" />

                {selected && (
                  <span className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center bg-copper">
                    <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
                  <span className="block font-heading text-2xl text-white sm:text-3xl">{pt.label}</span>
                  <span className="mt-1.5 block text-[11px] uppercase tracking-[0.14em] text-white/70">
                    {pt.sub}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11px] uppercase tracking-[0.16em] text-ivory/35">
        {value ? `Selected · ${value}` : "Select a product type to continue"}
      </p>
    </div>
  );
}

// ─── Step 2: Design Style ─────────────────────────────────────────────────────

function Step2Style({
  styles,
  value,
  onChange,
}: {
  styles: StyleEntry[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-copper">
            Step 2 · Style
          </p>
          <div className="editorial-rule mb-5 mt-4" />
          <h2 className="max-w-[14ch] font-heading text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.05] text-ivory">
            Choose your design direction.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-ivory/50 md:pb-1">
          Each style is a starting point — the forge adapts every detail to your vision.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:mt-12">
        {styles.map((style) => {
          const selected = value === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              aria-pressed={selected}
              className={cn(
                "group relative flex cursor-pointer flex-col overflow-hidden border text-left transition-all duration-300",
                selected
                  ? "border-copper ring-1 ring-copper/50"
                  : "border-white/12 hover:border-white/35",
              )}
            >
              <div className="relative aspect-[16/11] overflow-hidden bg-[#2a221c]">
                <Image
                  src={style.image}
                  alt={style.label}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={90}
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
                {selected && (
                  <span className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center bg-copper">
                    <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col bg-white/[0.03] p-5">
                <span className="font-heading text-xl text-ivory">{style.label}</span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-copper">
                  {style.mood}
                </span>
                <p className="mt-3 text-xs leading-relaxed text-white/45">{style.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Preferences ──────────────────────────────────────────────────────

function Step3Preferences({
  options,
  values,
  onChange,
}: {
  options: PlainCustomizationOption[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      <p className="font-heading text-xs uppercase tracking-[0.35em] text-copper">Step 3</p>
      <h2 className="mt-3 font-heading text-5xl leading-tight text-ivory lg:text-6xl">
        Specify your<br />preferences.
      </h2>
      <p className="mt-5 max-w-lg text-base text-white/50">
        Every choice shapes the final piece. Required fields are marked — optional ones invite experimentation.
      </p>

      {options.length === 0 ? (
        <div className="mt-14 border border-white/10 p-10 text-center text-white/40">
          No customization options available for this product type.
        </div>
      ) : (
        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          {options.map((opt) => (
            <OptionField key={opt.key} option={opt} value={values[opt.key] ?? ""} onChange={(v) => onChange(opt.key, v)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionField({
  option,
  value,
  onChange,
}: {
  option: PlainCustomizationOption;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block">
        <span className="text-xs uppercase tracking-[0.2em] text-white/70">
          {option.name}
          {option.isRequired && <span className="ml-1 text-copper">*</span>}
        </span>
        {option.description && (
          <span className="mt-1 block text-xs text-white/30">{option.description}</span>
        )}
      </label>

      {option.inputType === "select" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {option.values.map((v) => (
            <button
              key={v.value}
              onClick={() => onChange(v.value)}
              className={cn(
                "border px-4 py-2 text-xs transition-all",
                value === v.value
                  ? "border-copper bg-copper/15 text-copper"
                  : "border-white/15 text-white/50 hover:border-white/40 hover:text-white/80",
              )}
            >
              {v.label}
              {v.priceDelta > 0 && (
                <span className="ml-1 text-white/30">+${v.priceDelta}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {option.inputType === "color" && (
        <div className="mt-3 flex flex-wrap gap-3">
          {option.values.map((v) => {
            const colorMap: Record<string, string> = {
              natural: "#C8A97E",
              espresso: "#2C1A0E",
              copper: "#FF6B00",
              charcoal: "#2D2D2D",
            };
            return (
              <button
                key={v.value}
                onClick={() => onChange(v.value)}
                title={v.label}
                className={cn(
                  "flex items-center gap-2 border px-3 py-2 text-xs transition-all",
                  value === v.value
                    ? "border-copper text-copper"
                    : "border-white/15 text-white/50 hover:border-white/30",
                )}
              >
                <span
                  className="h-4 w-4 rounded-full border border-white/20"
                  style={{ backgroundColor: colorMap[v.value] ?? "#888" }}
                />
                {v.label}
              </button>
            );
          })}
        </div>
      )}

      {option.inputType === "text" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. J.H. · a name · a date"
          className="mt-3 w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
        />
      )}

      {option.inputType === "number" && (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-3 w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
        />
      )}

      {option.inputType === "boolean" && (
        <button
          onClick={() => onChange(value === "true" ? "false" : "true")}
          className={cn(
            "mt-3 flex items-center gap-3 border px-5 py-3 text-xs transition-all",
            value === "true"
              ? "border-copper bg-copper/10 text-copper"
              : "border-white/15 text-white/50 hover:border-white/30",
          )}
        >
          <span
            className={cn(
              "h-4 w-4 rounded-sm border",
              value === "true" ? "border-copper bg-copper" : "border-white/30",
            )}
          />
          Yes, include this
        </button>
      )}
    </div>
  );
}

// ─── Step 4: Images ───────────────────────────────────────────────────────────

function Step4Images({
  images,
  uploadingCount,
  fileInputRef,
  onFiles,
  onRemove,
}: {
  images: UploadedImage[];
  uploadingCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | null) => void;
  onRemove: (id: string) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <p className="font-heading text-xs uppercase tracking-[0.35em] text-copper">Step 4</p>
      <h2 className="mt-3 font-heading text-5xl leading-tight text-ivory lg:text-6xl">
        Upload reference<br />images. <span className="text-white/30">(Optional)</span>
      </h2>
      <p className="mt-5 max-w-lg text-base text-white/50">
        Share sketches, photos, or blades that inspire you. Up to 8 images. The forge will study each one.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "mt-14 flex cursor-pointer flex-col items-center justify-center border border-dashed px-8 py-16 text-center transition-all duration-200",
          dragging
            ? "border-copper bg-copper/10"
            : images.length < 8
              ? "border-white/20 bg-white/5 hover:border-white/40"
              : "border-white/10 opacity-50 cursor-not-allowed",
        )}
      >
        <svg className={cn("h-10 w-10", dragging ? "text-copper" : "text-white/25")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-3 3m3-3l3 3M4 20h16" />
        </svg>
        <p className="mt-4 text-sm text-white/50">
          {dragging ? "Drop to upload" : "Drag images here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-white/25">JPEG, PNG, WebP · Max 8 MB per file · {8 - images.length} remaining</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      {/* Thumbnails */}
      {(images.length > 0 || uploadingCount > 0) && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => {
            const previewSrc = img.localPreview || img.url;
            return (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden border border-white/15 bg-[#2a221c]"
              >
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSrc}
                    alt={img.alt || "Reference image"}
                    className={cn(
                      "h-full w-full object-cover",
                      !img.key && "opacity-70",
                    )}
                  />
                ) : (
                  <div className="grid h-full place-items-center px-3 text-center text-[10px] uppercase tracking-widest text-white/35">
                    Uploading…
                  </div>
                )}
                {!img.key && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/25">
                    <svg className="h-5 w-5 animate-spin text-copper" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(img.id);
                  }}
                  className="absolute right-2 top-2 grid h-7 w-7 cursor-pointer place-items-center bg-ink/70 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Contact ─────────────────────────────────────────────────────────

function Step5Contact({
  values,
  onChange,
}: {
  values: WizardState;
  onChange: (field: keyof WizardState, value: string) => void;
}) {
  return (
    <div>
      <p className="font-heading text-xs uppercase tracking-[0.35em] text-copper">Step 5</p>
      <h2 className="mt-3 font-heading text-5xl leading-tight text-ivory lg:text-6xl">
        Tell us about<br />yourself.
      </h2>
      <p className="mt-5 max-w-lg text-base text-white/50">
        We will reach you personally. No spam — only your commission correspondence.
      </p>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <Field label="Full Name" required>
          <input
            type="text"
            value={values.customerName}
            onChange={(e) => onChange("customerName", e.target.value)}
            placeholder="Your full name"
            className="mt-2 w-full border border-white/15 bg-transparent px-5 py-4 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
          />
        </Field>
        <Field label="Email Address" required>
          <input
            type="email"
            value={values.customerEmail}
            onChange={(e) => onChange("customerEmail", e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full border border-white/15 bg-transparent px-5 py-4 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            type="tel"
            value={values.customerPhone}
            onChange={(e) => onChange("customerPhone", e.target.value)}
            placeholder="+1 555 000 0000"
            className="mt-2 w-full border border-white/15 bg-transparent px-5 py-4 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
          />
        </Field>
        <Field label="Intended Use (optional)">
          <input
            type="text"
            value={values.intendedUse}
            onChange={(e) => onChange("intendedUse", e.target.value)}
            placeholder="e.g. daily kitchen use, collection piece, gift"
            className="mt-2 w-full border border-white/15 bg-transparent px-5 py-4 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
          />
        </Field>

        <div className="lg:col-span-2">
          <Field label="Describe your vision" required>
            <textarea
              value={values.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={5}
              placeholder="Tell the forge what you're imagining — blade form, proportions, feeling you're after, any inspirations…"
              className="mt-2 w-full resize-none border border-white/15 bg-transparent px-5 py-4 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
            />
          </Field>
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-white/70">Budget range (USD, optional)</span>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={values.budgetMin}
              onChange={(e) => onChange("budgetMin", e.target.value)}
              placeholder="Min"
              className="w-full border border-white/15 bg-transparent px-4 py-4 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
            />
            <span className="text-white/30">—</span>
            <input
              type="number"
              min={0}
              value={values.budgetMax}
              onChange={(e) => onChange("budgetMax", e.target.value)}
              placeholder="Max"
              className="w-full border border-white/15 bg-transparent px-4 py-4 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
            />
          </div>
        </div>

        <Field label="Preferred delivery date (optional)">
          <input
            type="date"
            value={values.preferredDeliveryDate}
            onChange={(e) => onChange("preferredDeliveryDate", e.target.value)}
            className="mt-2 w-full border border-white/15 bg-transparent px-5 py-4 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60 [color-scheme:dark]"
          />
        </Field>

        <div className="lg:col-span-2">
          <Field label="Additional comments (optional)">
            <textarea
              value={values.additionalComments}
              onChange={(e) => onChange("additionalComments", e.target.value)}
              rows={3}
              placeholder="Anything else the forge should know…"
              className="mt-2 w-full resize-none border border-white/15 bg-transparent px-5 py-4 text-sm text-ivory placeholder-white/25 outline-none focus:border-copper/60"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-xs uppercase tracking-[0.2em] text-white/70">
        {label}
        {required && <span className="ml-1 text-copper">*</span>}
      </span>
      {children}
    </div>
  );
}

// ─── Step 6: Review ───────────────────────────────────────────────────────────

function Step6Review({
  state,
  styles,
  options,
  onEdit,
}: {
  state: WizardState;
  styles: StyleEntry[];
  options: PlainCustomizationOption[];
  onEdit: (step: number) => void;
}) {
  const style = styles.find((s) => s.id === state.designStyle);
  const selectedPrefs = Object.entries(state.preferences).filter(([, v]) => v);

  return (
    <div>
      <p className="font-heading text-xs uppercase tracking-[0.35em] text-copper">Step 6</p>
      <h2 className="mt-3 font-heading text-5xl leading-tight text-ivory lg:text-6xl">
        Review your<br />commission.
      </h2>
      <p className="mt-5 max-w-lg text-base text-white/50">
        One last look before we send this to the forge. You can edit any section.
      </p>

      <div className="mt-14 space-y-6">
        <ReviewSection title="Product & Style" onEdit={() => onEdit(1)}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <dt className="text-white/40">Product type</dt>
            <dd className="capitalize text-ivory">{state.productType}</dd>
            <dt className="text-white/40">Design style</dt>
            <dd className="text-ivory">{style?.label ?? state.designStyle}</dd>
          </dl>
        </ReviewSection>

        {selectedPrefs.length > 0 && (
          <ReviewSection title="Preferences" onEdit={() => onEdit(3)}>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {selectedPrefs.map(([k, v]) => {
                const opt = options.find((o) => o.key === k);
                const val = opt?.values.find((ov) => ov.value === v);
                return (
                  <>
                    <dt key={`${k}-dt`} className="text-white/40">{opt?.name ?? k}</dt>
                    <dd key={`${k}-dd`} className="text-ivory">{val?.label ?? v}</dd>
                  </>
                );
              })}
            </dl>
          </ReviewSection>
        )}

        {state.referenceImages.length > 0 && (
          <ReviewSection title={`Reference Images (${state.referenceImages.length})`} onEdit={() => onEdit(4)}>
            <div className="flex flex-wrap gap-3">
              {state.referenceImages.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.localPreview || img.url}
                  alt={img.alt}
                  className="h-16 w-16 object-cover border border-white/15"
                />
              ))}
            </div>
          </ReviewSection>
        )}

        <ReviewSection title="Your Details" onEdit={() => onEdit(5)}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <dt className="text-white/40">Name</dt>
            <dd className="text-ivory">{state.customerName}</dd>
            <dt className="text-white/40">Email</dt>
            <dd className="text-ivory">{state.customerEmail}</dd>
            {state.customerPhone && (
              <>
                <dt className="text-white/40">Phone</dt>
                <dd className="text-ivory">{state.customerPhone}</dd>
              </>
            )}
            <dt className="text-white/40">Vision</dt>
            <dd className="text-ivory leading-relaxed">{state.description}</dd>
            {(state.budgetMin || state.budgetMax) && (
              <>
                <dt className="text-white/40">Budget</dt>
                <dd className="text-ivory">
                  {state.budgetMin && `$${state.budgetMin}`}
                  {state.budgetMin && state.budgetMax && " — "}
                  {state.budgetMax && `$${state.budgetMax}`}
                </dd>
              </>
            )}
          </dl>
        </ReviewSection>
      </div>

      <div className="mt-10 border border-copper/20 bg-copper/5 p-6 text-sm text-white/50">
        After submission, our team reviews your request and sends you a personal quotation within 2–3 business days. No payment is required now.
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-copper">{title}</span>
        <button
          onClick={onEdit}
          className="text-xs text-white/30 underline underline-offset-2 hover:text-white/70 transition-colors"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}
