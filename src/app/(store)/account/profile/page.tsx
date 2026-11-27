export const instant = false;

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { connection } from "next/server";
import { Customer, User } from "@/models";
import { ProfileForm } from "@/components/store/profile-form";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/profile");

  await connection();
  await connectToDatabase();

  const user = await User.findById(session.id).lean();
  const customer = session.customerId
    ? await Customer.findById(session.customerId).lean()
    : await Customer.findOne({ email: session.email, deletedAt: null }).lean();

  return (
    <div className="border border-border bg-white p-6">
      <h2 className="font-heading text-2xl text-ink">Profile</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Update your contact details and default shipping address.
      </p>
      <ProfileForm
        defaultValues={{
          name: user?.name ?? session.name,
          email: user?.email ?? session.email,
          phone: user?.phone ?? customer?.phone ?? "",
          address: customer?.addresses?.[0]
            ? {
                fullName: customer.addresses[0].fullName,
                phone: customer.addresses[0].phone,
                line1: customer.addresses[0].line1,
                line2: customer.addresses[0].line2 ?? "",
                city: customer.addresses[0].city,
                state: customer.addresses[0].state ?? "",
                postalCode: customer.addresses[0].postalCode,
                country: customer.addresses[0].country,
              }
            : {
                fullName: session.name,
                phone: "",
                line1: "",
                line2: "",
                city: "",
                state: "",
                postalCode: "",
                country: "US",
              },
        }}
      />
    </div>
  );
}
