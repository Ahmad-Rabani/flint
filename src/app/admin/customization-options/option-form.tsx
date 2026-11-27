"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type OptionValue = { label: string; value: string; priceDelta: string; isDefault: boolean; isActive: boolean };

type Props = {
  option?: {
    id: string;
    key: string;
    name: string;
    description?: string;
    productTypes: string[];
    inputType: string;
    values: { label: string; value: string; priceDelta: number; isDefault: boolean; isActive: boolean }[];
    isRequired: boolean;
    sortOrder: number;
    isActive: boolean;
  };
};

const PRODUCT_TYPES = ["knife", "axe", "utility"];
const INPUT_TYPES = ["select", "color", "text", "number", "boolean"];

export function OptionForm({ option }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [key, setKey] = useState(option?.key ?? "");
  const [name, setName] = useState(option?.name ?? "");
  const [description, setDescription] = useState(option?.description ?? "");
  const [productTypes, setProductTypes] = useState<string[]>(option?.productTypes ?? []);
  const [inputType, setInputType] = useState(option?.inputType ?? "select");
  const [isRequired, setIsRequired] = useState(option?.isRequired ?? false);
  const [sortOrder, setSortOrder] = useState(String(option?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(option?.isActive ?? true);
  const [values, setValues] = useState<OptionValue[]>(
    option?.values.map((v) => ({
      label: v.label,
      value: v.value,
      priceDelta: String(v.priceDelta),
      isDefault: v.isDefault,
      isActive: v.isActive,
    })) ?? []
  );

  function addValue() {
    setValues([...values, { label: "", value: "", priceDelta: "0", isDefault: false, isActive: true }]);
  }

  function updateValue(i: number, field: keyof OptionValue, val: string | boolean) {
    setValues(values.map((v, idx) => (idx === i ? { ...v, [field]: val } : v)));
  }

  function removeValue(i: number) {
    setValues(values.filter((_, idx) => idx !== i));
  }

  function toggleType(type: string) {
    setProductTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          key, name,
          description: description || undefined,
          productTypes,
          inputType,
          values: values.map((v) => ({
            label: v.label,
            value: v.value,
            priceDelta: parseFloat(v.priceDelta) || 0,
            isDefault: v.isDefault,
            isActive: v.isActive,
          })),
          isRequired,
          sortOrder: parseInt(sortOrder) || 0,
          isActive,
        };
        const url = option ? `/api/admin/customization-options/${option.id}` : "/api/admin/customization-options";
        const method = option ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Save failed");
        toast.success(option ? "Option updated" : "Option created");
        if (!option) router.push("/admin/customization-options");
        else router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  const inputCls = "w-full border border-[#171717]/20 bg-white px-3 py-2 text-sm text-[#171717] placeholder:text-[#171717]/30 focus:border-copper focus:outline-none";
  const labelCls = "block text-xs uppercase tracking-widest text-[#171717]/50 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Key *</label>
          <input className={`${inputCls} font-mono`} value={key} onChange={(e) => setKey(e.target.value)} required placeholder="blade_length" />
        </div>
        <div>
          <label className={labelCls}>Name *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Blade Length" />
        </div>
        <div>
          <label className={labelCls}>Input Type</label>
          <select className={inputCls} value={inputType} onChange={(e) => setInputType(e.target.value)}>
            {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Sort Order</label>
          <input type="number" className={inputCls} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea className={`${inputCls} h-20 resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>Applicable Product Types</label>
        <div className="flex gap-4">
          {PRODUCT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-copper" checked={productTypes.includes(type)} onChange={() => toggleType(type)} />
              <span className="text-sm capitalize text-[#171717]">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-copper" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} />
          <span className="text-sm text-[#171717]">Required</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-copper" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span className="text-sm text-[#171717]">Active</span>
        </label>
      </div>

      {/* Values */}
      <div>
        <label className={labelCls}>Option Values</label>
        <div className="space-y-2 mb-3">
          {values.length === 0 && (
            <p className="text-xs text-[#171717]/30 py-2">No values yet. For select/color types, add values below.</p>
          )}
          {values.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className={`${inputCls} flex-1`} placeholder="Label" value={v.label} onChange={(e) => updateValue(i, "label", e.target.value)} />
              <input className={`${inputCls} flex-1 font-mono`} placeholder="Value" value={v.value} onChange={(e) => updateValue(i, "value", e.target.value)} />
              <input type="number" step="0.01" className="w-24 border border-[#171717]/20 bg-white px-2 py-2 text-sm text-[#171717] focus:border-copper focus:outline-none" placeholder="±price" value={v.priceDelta} onChange={(e) => updateValue(i, "priceDelta", e.target.value)} />
              <label className="shrink-0 flex items-center gap-1 text-xs text-[#171717]/50 cursor-pointer">
                <input type="checkbox" className="accent-copper" checked={v.isDefault} onChange={(e) => updateValue(i, "isDefault", e.target.checked)} />
                Default
              </label>
              <button type="button" onClick={() => removeValue(i)} className="shrink-0 text-[#171717]/30 hover:text-red-500 text-lg px-1">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addValue} className="text-xs text-copper/70 hover:text-copper transition-colors">
          + Add Value
        </button>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="border border-[#171717] bg-[#171717] px-5 py-2.5 text-sm text-ivory hover:bg-[#171717]/90 transition-colors disabled:opacity-60">
          {isPending ? "Saving…" : option ? "Save Changes" : "Create Option"}
        </button>
        <a href="/admin/customization-options" className="border border-[#171717]/20 px-5 py-2.5 text-sm text-[#171717]/60 hover:border-[#171717]/40 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
