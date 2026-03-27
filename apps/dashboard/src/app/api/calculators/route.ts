import { executeCalculation } from "@/app/api/chat/tool-calculators";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

// ─── Simple in-memory rate limiter ──────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;

interface RateLimitEntry {
  readonly count: number;
  readonly resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);

  if (!existing || now >= existing.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  rateLimitStore.set(ip, {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  });
  return { allowed: true, remaining: RATE_LIMIT_MAX - existing.count - 1 };
}

// Periodic cleanup to avoid memory leak (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 300_000);

// ─── CORS headers ───────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

// ─── OPTIONS (preflight) ────────────────────────────────────────────
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// ─── Available calculator names ─────────────────────────────────────
const VALID_CALCULATORS = new Set([
  "margin",
  "markup",
  "equipment_roi",
  "cash_flow",
  "route_profitability",
  "labor_cost",
  "break_even",
  "revenue_share",
]);

// ─── POST handler ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded. Maximum 100 requests per minute.",
      },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          "Retry-After": "60",
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    const body = await request.json();
    const { calculator, inputs } = body as {
      calculator?: string;
      inputs?: Record<string, number>;
    };

    if (!calculator || typeof calculator !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: calculator",
          available: Array.from(VALID_CALCULATORS),
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (!VALID_CALCULATORS.has(calculator)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown calculator: ${calculator}`,
          available: Array.from(VALID_CALCULATORS),
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (!inputs || typeof inputs !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: inputs (object with numeric values)",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Validate that all input values are numbers
    const sanitizedInputs: Record<string, number> = {};
    for (const [key, value] of Object.entries(inputs)) {
      const num = Number(value);
      if (Number.isNaN(num)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid input: "${key}" must be a number`,
          },
          { status: 400, headers: CORS_HEADERS },
        );
      }
      sanitizedInputs[key] = num;
    }

    const resultStr = executeCalculation({
      calculator,
      inputs: sanitizedInputs,
    });

    const result = JSON.parse(resultStr) as Record<string, unknown>;

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { success: true, result },
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(remaining),
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request body. Expected JSON with { calculator, inputs }.",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
