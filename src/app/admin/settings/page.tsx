export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { BusinessSettings } from "@/models/BusinessSettings";
import { DEFAULT_PAYMENT_METHODS } from "@/constants";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  await requireAdminSession("settings.view");
  await connection();
  await connectToDatabase();

  const doc = await BusinessSettings.findOne({ key: "default" }).lean();

  const settings = {
    businessName: doc?.businessName ?? "FLINT",
    legalName: doc?.legalName ?? null,
    email: doc?.email ?? null,
    phone: doc?.phone ?? null,
    currency: doc?.currency ?? "USD",
    taxRate: doc?.taxRate ?? 0,
    taxInclusive: doc?.taxInclusive ?? false,
    paymentMethods: (doc?.paymentMethods ?? DEFAULT_PAYMENT_METHODS).map((pm) => ({
      id: pm.id ?? "",
      label: pm.label ?? "",
      enabled: pm.enabled ?? true,
    })),
    shipping: {
      flatRate: doc?.shipping?.flatRate ?? 15,
      freeOver: doc?.shipping?.freeOver ?? 250,
      estimatedDaysMin: doc?.shipping?.estimatedDaysMin ?? 7,
      estimatedDaysMax: doc?.shipping?.estimatedDaysMax ?? 21,
    },
    notifications: {
      orderEmail: doc?.notifications?.orderEmail ?? true,
      lowStockEmail: doc?.notifications?.lowStockEmail ?? true,
      customOrderEmail: doc?.notifications?.customOrderEmail ?? true,
    },
    seo: {
      defaultTitle: doc?.seo?.defaultTitle ?? null,
      defaultDescription: doc?.seo?.defaultDescription ?? null,
    },
    address: {
      line1: doc?.address?.line1 ?? null,
      line2: doc?.address?.line2 ?? null,
      city: doc?.address?.city ?? null,
      state: doc?.address?.state ?? null,
      postalCode: doc?.address?.postalCode ?? null,
      country: doc?.address?.country ?? null,
    },
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-copper/70">Settings</p>
      <h1 className="mt-1 font-heading text-4xl text-[#1B365D]">Business Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
