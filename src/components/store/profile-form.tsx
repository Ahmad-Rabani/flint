"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { addressSchema } from "@/lib/validation/checkout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: addressSchema,
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({ defaultValues }: { defaultValues: ProfileValues }) {
  const [saving, setSaving] = useState(false);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  async function onSubmit(values: ProfileValues) {
    setSaving(true);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error || "Could not save profile");
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" {...form.register("email")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Phone</Label>
          <Input {...form.register("phone")} />
        </div>
      </div>

      <div>
        <h3 className="font-heading text-xl text-ink">Default address</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Full name</Label>
            <Input {...form.register("address.fullName")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Phone</Label>
            <Input {...form.register("address.phone")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Input {...form.register("address.line1")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Line 2</Label>
            <Input {...form.register("address.line2")} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input {...form.register("address.city")} />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input {...form.register("address.state")} />
          </div>
          <div className="space-y-2">
            <Label>Postal code</Label>
            <Input {...form.register("address.postalCode")} />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input {...form.register("address.country")} />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="h-11 rounded-none bg-copper text-white hover:bg-copper/90"
      >
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
