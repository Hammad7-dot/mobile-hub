import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RateLimitAction = "order:create" | "order:track" | "used-phone:create";
type LimitResult = { allowed: boolean; limit: number; remaining: number; retry_after: number };

const policies: Record<RateLimitAction, { limit: number; windowSeconds: number }> = {
  "order:create": { limit: 5, windowSeconds: 600 },
  "order:track": { limit: 20, windowSeconds: 60 },
  "used-phone:create": { limit: 5, windowSeconds: 600 },
};

const memoryLimits = new Map<string, { count: number; resetAt: number }>();

function clientAddress(request: Request) {
  return request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

function memoryFallback(action: RateLimitAction, identifier: string): LimitResult {
  const policy = policies[action];
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const current = memoryLimits.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + policy.windowSeconds * 1000 }
    : { count: current.count + 1, resetAt: current.resetAt };
  memoryLimits.set(key, entry);
  return {
    allowed: entry.count <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - entry.count),
    retry_after: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export async function checkRateLimit(request: Request, action: RateLimitAction): Promise<LimitResult> {
  const identifier = clientAddress(request);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("consume_rate_limit", { p_action: action, p_identifier: identifier });
    if (!error && data && typeof data === "object") return data as LimitResult;
  } catch {
    // A per-process fallback keeps development and migration rollouts usable.
  }
  return memoryFallback(action, identifier);
}

export function rateLimitResponse(result: LimitResult) {
  if (result.allowed) return null;
  return NextResponse.json(
    { error: `Too many requests. Please try again in ${result.retry_after} seconds.` },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retry_after),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
