import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// Simple in-memory rate limiter
// ─────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
};

export function getRateLimitKey(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const path = req.nextUrl.pathname;
  return `${ip}:${path}`;
}

export function isRateLimited(
  req: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): boolean {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return false;
  }

  entry.count++;
  return entry.count > config.maxRequests;
}

export function getRateLimitHeaders(
  req: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): Record<string, string> {
  const key = getRateLimitKey(req);
  const entry = rateLimitMap.get(key);
  const now = Date.now();

  const remaining = entry
    ? Math.max(0, config.maxRequests - entry.count)
    : config.maxRequests;
  const reset = entry?.resetAt ?? now + config.windowMs;

  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };
}

export function rateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): NextResponse | null {
  if (isRateLimited(req, config)) {
    return NextResponse.json(
      { error: "Too many requests, please try again later." },
      {
        status: 429,
        headers: getRateLimitHeaders(req, config),
      }
    );
  }
  return null;
}

// Cleanup old entries periodically
if (typeof global !== "undefined") {
  (global as any).__rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 60 * 1000);
}
