// ─── Date range helper ──────────────────────────────────────────────

export function getDateRange(period?: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0]!;
  let from: string;

  switch (period) {
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0]!;
      break;
    case "last_month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      from = d.toISOString().split("T")[0]!;
      break;
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      from = new Date(now.getFullYear(), q, 1).toISOString().split("T")[0]!;
      break;
    }
    case "last_quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3 - 3;
      from = new Date(now.getFullYear(), q, 1).toISOString().split("T")[0]!;
      break;
    }
    case "this_year":
      from = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]!;
      break;
    case "last_year":
      from = new Date(now.getFullYear() - 1, 0, 1).toISOString().split("T")[0]!;
      break;
    case "last_6_months":
      from = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        .toISOString()
        .split("T")[0]!;
      break;
    case "last_12_months":
    default:
      from = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        .toISOString()
        .split("T")[0]!;
      break;
  }
  return { from, to };
}

export function handleToolError(error: unknown): string {
  return `Unable to retrieve data: ${error instanceof Error ? error.message : "An unexpected error occurred"}. Please try again.`;
}
