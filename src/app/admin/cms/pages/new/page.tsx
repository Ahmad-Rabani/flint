export const instant = false;

import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/admin";
import { CMSPageForm } from "../cms-page-form";

export default async function NewCMSPagePage() {
  await requireAdminSession("cms.manage");
  return (
    <div>
      <Link href="/admin/cms/pages" className="text-xs uppercase tracking-widest text-copper/60 hover:text-copper transition-colors">← Pages</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-copper/70">CMS</p>
      <h1 className="mt-1 font-heading text-4xl text-[#171717]">New Page</h1>
      <CMSPageForm />
    </div>
  );
}
