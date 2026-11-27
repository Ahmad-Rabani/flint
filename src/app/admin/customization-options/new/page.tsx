export const instant = false;

import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/admin";
import { OptionForm } from "../option-form";

export default async function NewCustomizationOptionPage() {
  await requireAdminSession("customization.manage");
  return (
    <div>
      <Link href="/admin/customization-options" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Customization Options</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-copper/70">Catalogue</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">New Option</h1>
      <OptionForm />
    </div>
  );
}
