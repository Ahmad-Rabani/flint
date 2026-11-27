export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { CustomizationOption } from "@/models/CustomizationOption";
import { OptionForm } from "../option-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditOptionPage({ params }: Props) {
  await requireAdminSession("customization.manage");
  const { id } = await params;
  await connection();
  await connectToDatabase();
  const doc = await CustomizationOption.findOne({ _id: id, deletedAt: null }).lean();
  if (!doc) notFound();

  const option = {
    id: String(doc._id),
    key: doc.key,
    name: doc.name,
    description: doc.description ?? undefined,
    productTypes: (doc.productTypes as string[]) ?? [],
    inputType: doc.inputType ?? "select",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    values: ((doc.values as any[]) ?? []).map((v: any) => ({
      label: String(v.label ?? ""),
      value: String(v.value ?? ""),
      priceDelta: Number(v.priceDelta ?? 0),
      isDefault: Boolean(v.isDefault),
      isActive: v.isActive !== false,
    })),
    isRequired: !!doc.isRequired,
    sortOrder: doc.sortOrder ?? 0,
    isActive: doc.isActive !== false,
  };

  return (
    <div>
      <Link href="/admin/customization-options" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Customization Options</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">{option.name}</h1>
      <OptionForm option={option} />
    </div>
  );
}
