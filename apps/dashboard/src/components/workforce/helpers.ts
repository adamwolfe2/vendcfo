// ---------------------------------------------------------------------------
// Helper functions for workforce / employees
// ---------------------------------------------------------------------------

export function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "string" ? Number.parseFloat(val) : val;
  return Number.isNaN(n) ? 0 : n;
}

export function fmtCurrency(val: number): string {
  return `$${val.toFixed(2)}`;
}

export function maskValue(val: string | null): string {
  if (!val || val.length < 4) return "****";
  return `****${val.slice(-4)}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
