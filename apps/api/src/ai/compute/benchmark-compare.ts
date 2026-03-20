import { VENDING_BENCHMARKS } from "@vendcfo/vending-kb/benchmarks";

export interface BenchmarkComparison {
  metric: string;
  label: string;
  value: number;
  unit: string;
  benchmark_low?: number;
  benchmark_target?: number;
  benchmark_high?: number;
  status: "below_range" | "in_range" | "above_range" | "at_target" | "unknown";
  delta_from_target?: number;
  narrative: string; // Pre-computed human-readable comparison
}

export interface PeriodComparison {
  current_value: number;
  previous_value: number;
  change_amount: number;
  change_pct: number;
  direction: "increasing" | "decreasing" | "flat";
  narrative: string;
}

export function compareGrossMargin(
  value: number,
  productType?: "snacks" | "beverages" | "mixed",
): BenchmarkComparison {
  const target = productType
    ? VENDING_BENCHMARKS.grossMargin[productType].target
    : VENDING_BENCHMARKS.grossMargin.overall.target;
  const low = VENDING_BENCHMARKS.grossMargin.overall.low;
  const excellent = VENDING_BENCHMARKS.grossMargin.overall.excellent;

  const pct = (value * 100).toFixed(1);
  const targetPct = (target * 100).toFixed(0);

  let status: BenchmarkComparison["status"] = "unknown";
  let narrative = "";

  if (value >= excellent) {
    status = "above_range";
    narrative = `Gross margin of ${pct}% is excellent — above the ${(excellent * 100).toFixed(0)}% industry benchmark.`;
  } else if (value >= target) {
    status = "at_target";
    narrative = `Gross margin of ${pct}% meets the industry target of ${targetPct}%.`;
  } else if (value >= low) {
    status = "in_range";
    narrative = `Gross margin of ${pct}% is below the ${targetPct}% target. ${((target - value) * 100).toFixed(1)}pp gap to close.`;
  } else {
    status = "below_range";
    narrative = `Gross margin of ${pct}% is significantly below the industry minimum of ${(low * 100).toFixed(0)}%. Immediate action needed on COGS or pricing.`;
  }

  return {
    metric: "gross_margin",
    label: "Gross Margin",
    value,
    unit: "percentage",
    benchmark_low: low,
    benchmark_target: target,
    benchmark_high: excellent,
    status,
    delta_from_target: value - target,
    narrative,
  };
}

export function compareLaborPct(value: number): BenchmarkComparison {
  const { targetMin, targetMax, high } =
    VENDING_BENCHMARKS.costStructure.laborPct;
  const pct = (value * 100).toFixed(1);

  let status: BenchmarkComparison["status"] = "unknown";
  let narrative = "";

  if (value <= targetMin) {
    status = "below_range";
    narrative = `Labor at ${pct}% of revenue is lean — below the ${(targetMin * 100).toFixed(0)}% minimum. Verify routes are adequately staffed.`;
  } else if (value <= targetMax) {
    status = "at_target";
    narrative = `Labor at ${pct}% of revenue is within the healthy ${(targetMin * 100).toFixed(0)}-${(targetMax * 100).toFixed(0)}% range.`;
  } else if (value <= high) {
    status = "in_range";
    narrative = `Labor at ${pct}% of revenue is above the ${(targetMax * 100).toFixed(0)}% target. Consider route consolidation or reducing visit frequency.`;
  } else {
    status = "above_range";
    narrative = `Labor at ${pct}% of revenue is high (industry ceiling is ${(high * 100).toFixed(0)}%). Route optimization or staffing changes needed.`;
  }

  return {
    metric: "labor_pct",
    label: "Labor Cost (% of Revenue)",
    value,
    unit: "percentage",
    benchmark_low: targetMin,
    benchmark_target: targetMax,
    benchmark_high: high,
    status,
    delta_from_target: value - targetMax,
    narrative,
  };
}

export function compareRevenuePerMachine(value: number): BenchmarkComparison {
  const { low, typical, good, top } = VENDING_BENCHMARKS.revenuePerMachine;
  const formatted = `$${value.toFixed(0)}`;

  let status: BenchmarkComparison["status"] = "unknown";
  let narrative = "";

  if (value >= good) {
    status = "above_range";
    narrative = `Revenue of ${formatted}/machine/month is strong — in the top tier ($${good}+ target).`;
  } else if (value >= typical) {
    status = "at_target";
    narrative = `Revenue of ${formatted}/machine/month is at the typical range ($${typical}-${good}). Room to grow with better locations or product mix.`;
  } else if (value >= low) {
    status = "in_range";
    narrative = `Revenue of ${formatted}/machine/month is below typical ($${typical}). Consider relocating low-performers or adjusting pricing.`;
  } else {
    status = "below_range";
    narrative = `Revenue of ${formatted}/machine/month is below the industry minimum ($${low}). These machines may not be profitable.`;
  }

  return {
    metric: "revenue_per_machine",
    label: "Revenue per Machine",
    value,
    unit: "USD/month",
    benchmark_low: low,
    benchmark_target: good,
    benchmark_high: top,
    status,
    delta_from_target: value - good,
    narrative,
  };
}

export function compareCommissionPct(value: number): BenchmarkComparison {
  const { typicalMin, typicalMax, high } =
    VENDING_BENCHMARKS.costStructure.commissionPct;
  const pct = (value * 100).toFixed(1);

  let status: BenchmarkComparison["status"] = "unknown";
  let narrative = "";

  if (value <= typicalMin) {
    status = "below_range";
    narrative = `Commission at ${pct}% is below typical (${(typicalMin * 100).toFixed(0)}%). Good terms — protect this relationship.`;
  } else if (value <= typicalMax) {
    status = "at_target";
    narrative = `Commission at ${pct}% is within the normal ${(typicalMin * 100).toFixed(0)}-${(typicalMax * 100).toFixed(0)}% range.`;
  } else {
    status = "above_range";
    narrative = `Commission at ${pct}% is above typical (max ${(typicalMax * 100).toFixed(0)}%). Consider renegotiating or evaluate if location revenue justifies the rate.`;
  }

  return {
    metric: "commission_pct",
    label: "Location Commission",
    value,
    unit: "percentage",
    benchmark_low: typicalMin,
    benchmark_target: typicalMax,
    benchmark_high: high,
    status,
    delta_from_target: value - typicalMax,
    narrative,
  };
}

export function computePeriodComparison(
  current: number,
  previous: number,
  metricLabel: string,
): PeriodComparison {
  if (previous === 0) {
    return {
      current_value: current,
      previous_value: previous,
      change_amount: current,
      change_pct: current > 0 ? 100 : 0,
      direction: current > 0 ? "increasing" : "flat",
      narrative: `${metricLabel}: $${current.toFixed(2)} (no prior period data for comparison).`,
    };
  }

  const change_amount = current - previous;
  const change_pct = (change_amount / Math.abs(previous)) * 100;
  const direction: PeriodComparison["direction"] =
    Math.abs(change_pct) < 1
      ? "flat"
      : change_pct > 0
        ? "increasing"
        : "decreasing";

  const arrow =
    direction === "increasing"
      ? "up"
      : direction === "decreasing"
        ? "down"
        : "flat";
  const narrative = `${metricLabel}: $${current.toFixed(2)} (${arrow} ${Math.abs(change_pct).toFixed(1)}% from $${previous.toFixed(2)} prior period).`;

  return {
    current_value: current,
    previous_value: previous,
    change_amount,
    change_pct,
    direction,
    narrative,
  };
}

/**
 * Validate a metric value for obvious impossibilities
 */
export function validateMetric(
  metric: string,
  value: number,
): { valid: boolean; warning?: string } {
  if (metric.includes("margin") || metric.includes("pct")) {
    if (value < -1 || value > 1)
      return {
        valid: false,
        warning: `${metric} of ${(value * 100).toFixed(1)}% is outside possible range (-100% to 100%)`,
      };
  }
  if (metric.includes("revenue") && value < 0) {
    return {
      valid: false,
      warning: `Negative revenue detected for ${metric}. This may indicate a data issue.`,
    };
  }
  if (metric.includes("growth") && Math.abs(value) > 10) {
    return {
      valid: false,
      warning: `${metric} growth of ${(value * 100).toFixed(0)}% is extreme. Verify underlying data.`,
    };
  }
  return { valid: true };
}
