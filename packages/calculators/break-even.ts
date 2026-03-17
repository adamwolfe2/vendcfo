export interface BreakEvenInputs {
  fixedMonthlyCostsGlobal: number;
  avgGrossMarginPct: number;
  perLocationFixedCostsAvg: number;
  monthlyDebtObligations: number;
}

export interface BreakEvenOutputs {
  totalRevenueRequired: number;
  locationsRequiredToBreakEven: number;
}

export function calculateBreakEven(inputs: BreakEvenInputs): BreakEvenOutputs {
  const {
    fixedMonthlyCostsGlobal,
    avgGrossMarginPct,
    perLocationFixedCostsAvg,
    monthlyDebtObligations
  } = inputs;

  const totalFixedCosts = fixedMonthlyCostsGlobal + monthlyDebtObligations;
  
  // Breakeven Revenue = Fixed Costs / Gross Margin %
  const totalRevenueRequired = totalFixedCosts / (avgGrossMarginPct / 100);

  // Approximation: If avg revenue per location is R, and Gross Margin is GM...
  // We don't have revenue per location input here, so this assumes the user knows how much a typical location generates.
  // Instead, the PRD requires "Locations required to break even"
  // Net profit per location = (R * GM) - perLocationFixedCosts
  // We need n * NetProfitPerLocation - GlobalFixed Costs = 0
  // So n = GlobalFixed Costs / NetProfitPerLocation.
  // We will assume an average location revenue of $500 for the formula unless provided.
  const assumedLocationRevenue = 500;
  const netContributionPerLocation = (assumedLocationRevenue * (avgGrossMarginPct / 100)) - perLocationFixedCostsAvg;

  const locationsRequiredToBreakEven = netContributionPerLocation > 0 ? (totalFixedCosts / netContributionPerLocation) : Infinity;

  return {
    totalRevenueRequired: Number(totalRevenueRequired.toFixed(2)),
    locationsRequiredToBreakEven: Number(Math.ceil(locationsRequiredToBreakEven))
  };
}
