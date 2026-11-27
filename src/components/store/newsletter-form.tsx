"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function NewsletterFormClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDone(true);
      toast.success("You're on the list.", { description: "We'll be in touch." });
      setEmail("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 py-4 px-6 border border-copper/30 text-copper text-sm">
        Thank you — watch your inbox for stories from the forge.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-sm mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 min-w-0 bg-white/5 border border-white/10 px-4 py-3 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-copper/60 transition-colors"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-copper hover:bg-copper/90 text-white px-5 py-3 transition-colors disabled:opacity-60 flex items-center gap-2 text-xs uppercase tracking-widest whitespace-nowrap"
      >
        {loading ? "..." : <><span className="hidden sm:inline">Subscribe</span><ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}
