/**
 * Vending Industry Financial Benchmarks
 * Source: Industry data for US vending machine operators
 * Used by AI agents to contextualize performance vs industry norms
 */

export const VENDING_BENCHMARKS = {
  revenuePerMachine: {
    low: 150,
    typical: 300,
    good: 600,
    top: 1000,
    unit: "USD/month",
    note: "Varies by location type, product mix, and foot traffic",
  },
  netProfitPerMachine: {
    low: 40,
    typical: 150,
    good: 300,
    unit: "USD/month",
  },
  netProfitMargin: {
    low: 0.15,
    typical: 0.28,
    good: 0.35,
    unit: "percentage",
  },
  grossMargin: {
    snacks: { cogs: { low: 0.40, high: 0.55 }, target: 0.52 },
    beverages: { cogs: { low: 0.35, high: 0.50 }, target: 0.58 },
    mixed: { cogs: { low: 0.38, high: 0.52 }, target: 0.53 },
    overall: { low: 0.45, target: 0.52, excellent: 0.60 },
  },
  routeEconomics: {
    machinesPerRoute: { low: 15, typical: 25, high: 40 },
    revenuePerRoute: { low: 4000, typical: 8000, good: 15000, unit: "USD/month" },
    revenuePerStop: { low: 150, typical: 300, good: 500, unit: "USD/visit" },
    stopsPerDay: { low: 8, typical: 12, high: 20 },
  },
  costStructure: {
    laborPct: { targetMin: 0.12, targetMax: 0.18, high: 0.22, unit: "% of revenue" },
    fuelVehiclePct: { targetMin: 0.04, targetMax: 0.06, high: 0.08, unit: "% of revenue" },
    commissionPct: { typicalMin: 0.10, typicalMax: 0.20, high: 0.25, unit: "% of revenue" },
    insurancePct: { typical: 0.02, high: 0.04, unit: "% of revenue" },
    repairsPct: { typical: 0.03, high: 0.06, unit: "% of revenue" },
  },
  equipment: {
    newMachine: { low: 3000, typical: 5000, high: 7000, unit: "USD" },
    refurbishedMachine: { low: 1500, typical: 2500, high: 3500, unit: "USD" },
    paybackMonths: { fast: 12, typical: 18, slow: 36 },
    typicalAPR: { low: 0.06, typical: 0.085, high: 0.12 },
    typicalTermMonths: { short: 24, typical: 36, long: 48 },
  },
  seasonality: {
    schoolLocations: "Revenue drops 30-50% during summer break (Jun-Aug)",
    officeLocations: "Steady year-round, slight dip in Dec holidays",
    gymLocations: "Peak Jan-Mar (New Year resolutions), dip Jul-Aug",
    transitLocations: "Steady with slight weekend dip",
    factoryLocations: "Follows shift schedules, steady if 24/7 operation",
  },
} as const;

export type VendingBenchmarks = typeof VENDING_BENCHMARKS;

/**
 * Generate benchmark comparison text for AI agents
 */
export function compareToBenchmark(
  metric: string,
  value: number,
  benchmark: { low?: number; typical?: number; target?: number; good?: number; high?: number; targetMin?: number; targetMax?: number },
): string {
  if (benchmark.target !== undefined) {
    if (value >= benchmark.target) {
      return `Your ${metric} of ${(value * 100).toFixed(1)}% meets or exceeds the industry target of ${(benchmark.target * 100).toFixed(1)}%.`;
    }
    const gap = ((benchmark.target - value) * 100).toFixed(1);
    return `Your ${metric} is ${(value * 100).toFixed(1)}%, which is ${gap}pp below the industry target of ${(benchmark.target * 100).toFixed(1)}%.`;
  }
  if (benchmark.targetMin !== undefined && benchmark.targetMax !== undefined) {
    if (value >= benchmark.targetMin && value <= benchmark.targetMax) {
      return `Your ${metric} of ${(value * 100).toFixed(1)}% is within the healthy range of ${(benchmark.targetMin * 100).toFixed(0)}-${(benchmark.targetMax * 100).toFixed(0)}%.`;
    }
    if (value > benchmark.targetMax) {
      return `Your ${metric} of ${(value * 100).toFixed(1)}% is above the typical range of ${(benchmark.targetMin * 100).toFixed(0)}-${(benchmark.targetMax * 100).toFixed(0)}%. Consider optimizing.`;
    }
    return `Your ${metric} of ${(value * 100).toFixed(1)}% is below the typical range of ${(benchmark.targetMin * 100).toFixed(0)}-${(benchmark.targetMax * 100).toFixed(0)}%.`;
  }
  return "";
}

/**
 * Formatted benchmark context string for injection into AI agent prompts
 */
export const BENCHMARK_CONTEXT = `
<vending-industry-benchmarks>
REVENUE:
- Revenue per machine: $150-400/mo typical, $400-800 good, $1000+ top performers
- Net profit per machine: $40-300/mo, 25-35% net margin typical
- Revenue per route: $4,000-15,000/mo depending on density

MARGINS:
- Snacks: COGS 40-55%, target gross margin 45-60%
- Beverages: COGS 35-50%, target gross margin 50-65%
- Mixed/combo: target 50-55% overall gross margin
- Overall gross margin target: 52%

COST STRUCTURE (as % of revenue):
- Labor: 12-18% target, above 22% is high
- Fuel/vehicle: 4-6% target, above 8% is high
- Location commission: 10-20% typical, above 25% is high
- Insurance: ~2% typical
- Repairs/maintenance: ~3% typical

EQUIPMENT:
- New machine: $3,000-7,000
- Refurbished: $1,500-3,500
- Target payback: 12-18 months
- Typical financing: 8.5% APR, 36 months

SEASONALITY:
- Schools: -30-50% revenue Jun-Aug
- Offices: steady, slight Dec dip
- Gyms: peak Jan-Mar, dip Jul-Aug

Use these benchmarks to contextualize the user's data. Say things like:
- "Your gross margin is 45%; well-run routes target 50-55% for this mix."
- "Location A is in the bottom quartile for revenue per machine."
- "Your labor cost at 24% is above the 12-18% target range."
</vending-industry-benchmarks>
`;
