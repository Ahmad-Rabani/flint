"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setupAdminSchema, type SetupAdminInput } from "@/lib/validation/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SetupPage() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SetupAdminInput>({
    resolver: zodResolver(setupAdminSchema),
    defaultValues: {
      name: "FLINT Admin",
      email: "admin@flint.studio",
      password: "",
      businessName: "FLINT",
    },
  });

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => setReady(Boolean(data.setupRequired)))
      .catch(() => setReady(false));
  }, []);

  async function onSubmit(values: SetupAdminInput) {
    setError(null);
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Setup failed");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  if (ready === null) {
    return <p className="text-ivory/50">Checking setup status…</p>;
  }

  if (!ready) {
    return (
      <div className="max-w-md text-center">
        <h1 className="font-heading text-3xl text-ivory">Setup already complete</h1>
        <p className="mt-3 text-sm text-ivory/55">Sign in with an administrator account.</p>
        <Button
          className="mt-8 rounded-none bg-copper text-white"
          onClick={() => router.push("/login")}
        >
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-copper">Initial setup</p>
      <h1 className="font-heading text-4xl text-ivory">Create super admin</h1>
      <p className="mt-3 text-sm text-ivory/55">
        This creates the first administrator for the unified CMS and POS console.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label className="text-ivory/70">Business name</Label>
          <Input className="border-white/15 bg-white/5 text-ivory placeholder:text-ivory/45 caret-ivory" {...form.register("businessName")} />
        </div>
        <div className="space-y-2">
          <Label className="text-ivory/70">Admin name</Label>
          <Input className="border-white/15 bg-white/5 text-ivory placeholder:text-ivory/45 caret-ivory" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label className="text-ivory/70">Email</Label>
          <Input
            type="email"
            className="border-white/15 bg-white/5 text-ivory placeholder:text-ivory/45 caret-ivory"
            {...form.register("email")}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-ivory/70">Password</Label>
          <Input
            type="password"
            className="border-white/15 bg-white/5 text-ivory placeholder:text-ivory/45 caret-ivory"
            {...form.register("password")}
          />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-12 w-full rounded-none bg-copper text-white"
        >
          {form.formState.isSubmitting ? "Creating…" : "Complete setup"}
        </Button>
      </form>
    </div>
  );
}
