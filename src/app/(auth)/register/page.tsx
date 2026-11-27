"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to create account");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-copper">Join the atelier</p>
      <h1 className="font-heading text-4xl text-ivory">Create account</h1>
      <p className="mt-3 text-sm text-ivory/55">
        Track orders, save favorites, and submit custom blade requests.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-ivory/70">
            Full name
          </Label>
          <Input
            id="name"
            className="border-white/15 bg-white/5 text-ivory placeholder:text-ivory/45 caret-ivory"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-300">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-ivory/70">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            className="border-white/15 bg-white/5 text-ivory placeholder:text-ivory/45 caret-ivory"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-300">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-ivory/70">
            Phone <span className="text-ivory/35">(optional)</span>
          </Label>
          <Input
            id="phone"
            className="border-white/15 bg-white/5 text-ivory placeholder:text-ivory/45 caret-ivory"
            {...form.register("phone")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-ivory/70">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            className="border-white/15 bg-white/5 text-ivory placeholder:text-ivory/45 caret-ivory"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-red-300">{form.formState.errors.password.message}</p>
          )}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full rounded-none bg-copper text-white hover:bg-copper/90"
        >
          {form.formState.isSubmitting ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-ivory/50">
        Already have an account?{" "}
        <Link href="/login" className="text-copper hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
