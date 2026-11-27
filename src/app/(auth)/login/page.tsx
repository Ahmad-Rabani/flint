"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to sign in");
      return;
    }

    const role = data.user?.role;
    if (next) {
      router.push(next);
    } else if (role && role !== "customer") {
      router.push("/admin");
    } else {
      router.push("/account");
    }
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-copper">Welcome back</p>
      <h1 className="font-heading text-4xl text-ivory">Sign in</h1>
      <p className="mt-3 text-sm text-ivory/55">
        Access your orders, wishlist, and custom design requests.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-ivory/70">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="border-white/15 bg-white/5 text-ivory"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-300">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-ivory/70">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="border-white/15 bg-white/5 text-ivory"
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
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-ivory/50">
        New to FLINT?{" "}
        <Link href="/register" className="text-copper hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-ivory/50">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
