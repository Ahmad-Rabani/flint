import { jsonError } from "@/lib/api";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

const IP_PATTERN = /^[a-fA-F0-9:.]+$/;

function plausibleIp(value: string) {
  const ip = value.trim();
  if (!ip || ip.length > 64 || !IP_PATTERN.test(ip)) return null;
  return ip;
}

/**
 * Client address for rate-limit keys.
 * Uses the last X-Forwarded-For hop (the address a proxy appended), then X-Real-IP.
 * Header values are validated so a forged header cannot grow the key space with junk.
 * Direct exposure without a proxy that overwrites these headers can still be spoofed.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const ip = plausibleIp(parts[i] ?? "");
      if (ip) return ip;
    }
  }

  const real = plausibleIp(request.headers.get("x-real-ip") ?? "");
  if (real) return real;

  return "unknown";
}

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

/** Fixed window counter. In-memory only — one Node process, resets on restart. */
export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  prune(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function tooManyRequests(retryAfterSec: number) {
  const response = jsonError(
    `Too many requests. Try again in ${retryAfterSec} seconds.`,
    429,
  );
  response.headers.set("Retry-After", String(retryAfterSec));
  return response;
}
