import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

// ─── Types ─────────────────────────────────────────────────────────
interface ComparisonItem {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  readonly price: number;
  readonly margin: number;
  readonly markup: number;
  readonly profit: number;
}

interface ChatRequest {
  message: string;
  items: ComparisonItem[];
}

// ─── Rate limiting ──────────────────────────────────────────────────
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

interface RateLimitEntry {
  readonly count: number;
  readonly resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry || now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  store.set(ip, { count: entry.count + 1, resetAt: entry.resetAt });
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (now >= v.resetAt) store.delete(k);
  }
}, 300_000);

// ─── CORS ───────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// ─── Margin math ────────────────────────────────────────────────────
function calcMargin(cost: number, price: number) {
  const profit = price - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const markup = cost > 0 ? (profit / cost) * 100 : 0;
  return {
    profit: Number(profit.toFixed(2)),
    margin: Number(margin.toFixed(1)),
    markup: Number(markup.toFixed(1)),
  };
}

// ─── Intent parsing ─────────────────────────────────────────────────

function parseAddItem(
  msg: string,
): { name: string; cost: number; price: number } | null {
  // Strip "add" prefix
  const clean = msg.replace(/^add\s+/i, "").trim();

  // Try to extract exactly 2 numbers
  const nums = clean.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return null;

  const cost = parseFloat(nums[0] ?? "0");
  const price = parseFloat(nums[1] ?? "0");
  if (cost <= 0 || price <= 0 || price <= cost) return null;

  // Name = everything before the first number
  const firstNumIdx = clean.search(/\d/);
  let name = clean.slice(0, firstNumIdx).trim().replace(/[,:-]+$/, "").trim();
  // Remove common labels
  name = name.replace(/\b(cost|price|sell|revenue|rev)\b/gi, "").trim();
  if (!name) name = "Item";

  // Capitalize first letter of each word
  name = name.replace(/\b\w/g, (c) => c.toUpperCase());

  return { name, cost, price };
}

function parseRemoveTarget(msg: string): string | null {
  const m = msg.match(/(?:remove|delete|drop)\s+(.+)/i);
  return m?.[1]?.trim() ?? null;
}

function isClear(msg: string): boolean {
  return /\b(clear|reset|start over|new list|restart)\b/i.test(msg);
}

function isCompare(msg: string): boolean {
  return /\b(compare|comparison|best|highest|lowest|rank|sort|which|what'?s better)\b/i.test(
    msg,
  );
}

function isHelp(msg: string): boolean {
  return /\b(help|how|what can|example|tutorial)\b/i.test(msg);
}

// ─── Generate compare reply ─────────────────────────────────────────
function compareReply(items: ComparisonItem[]): string {
  if (items.length === 0) return "No items yet. Add a product to get started.";
  if (items.length === 1)
    return `Only ${items[0].name} so far — add another item to compare!`;

  const sorted = [...items].sort((a, b) => b.margin - a.margin);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const diff = best.margin - worst.margin;

  return `Best margin: ${best.name} at ${best.margin}% (${diff.toFixed(1)}pp ahead of ${worst.name}).`;
}

// ─── POST handler ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRate(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: CORS },
    );
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400, headers: CORS },
    );
  }

  const msg = (body.message ?? "").trim();
  const currentItems: ComparisonItem[] = Array.isArray(body.items)
    ? body.items
    : [];

  if (!msg) {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400, headers: CORS },
    );
  }

  // ── Clear
  if (isClear(msg)) {
    return NextResponse.json(
      {
        action: "clear_all",
        reply: "Cleared! Start fresh — tell me about a product.",
        item: null,
        removeId: null,
      },
      { status: 200, headers: CORS },
    );
  }

  // ── Remove
  const removeTarget = parseRemoveTarget(msg);
  if (removeTarget) {
    const match = currentItems.find((i) =>
      i.name.toLowerCase().includes(removeTarget.toLowerCase()),
    );
    if (match) {
      return NextResponse.json(
        {
          action: "remove_item",
          reply: `Removed ${match.name}.`,
          item: null,
          removeId: match.id,
        },
        { status: 200, headers: CORS },
      );
    }
    return NextResponse.json(
      {
        action: "chat",
        reply: `Couldn't find "${removeTarget}" in your list.`,
        item: null,
        removeId: null,
      },
      { status: 200, headers: CORS },
    );
  }

  // ── Compare
  if (isCompare(msg)) {
    return NextResponse.json(
      {
        action: "compare",
        reply: compareReply(currentItems),
        item: null,
        removeId: null,
      },
      { status: 200, headers: CORS },
    );
  }

  // ── Help
  if (isHelp(msg) && currentItems.length === 0) {
    return NextResponse.json(
      {
        action: "help",
        reply:
          'Try: "Chips $1.20 $2.50" or "Water bottles, cost 0.50, sell 1.25"',
        item: null,
        removeId: null,
      },
      { status: 200, headers: CORS },
    );
  }

  // ── Add item
  const parsed = parseAddItem(msg);
  if (parsed) {
    const { profit, margin, markup } = calcMargin(parsed.cost, parsed.price);
    const item: ComparisonItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: parsed.name,
      cost: parsed.cost,
      price: parsed.price,
      margin,
      markup,
      profit,
    };

    const reply =
      margin >= 50
        ? `${item.name}: ${margin}% margin — solid!`
        : margin >= 30
          ? `${item.name}: ${margin}% margin. Room to improve.`
          : `${item.name}: ${margin}% margin — consider raising price or cutting cost.`;

    return NextResponse.json(
      { action: "add_item", reply, item, removeId: null },
      { status: 200, headers: CORS },
    );
  }

  // ── Fallback
  return NextResponse.json(
    {
      action: "chat",
      reply:
        currentItems.length === 0
          ? 'Try: "Chips $1.20 $2.50" — name, cost, selling price.'
          : `Not sure what you mean. Add more items or ask me to compare.`,
      item: null,
      removeId: null,
    },
    { status: 200, headers: CORS },
  );
}
