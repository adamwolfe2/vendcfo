export interface LaborInputs {
  hourlyWage: number;
  hoursPerWeek: number;
  payrollBurdenPct?: number; // Default 15%
  expectedRouteRevenueIncrease: number; // Monthly
  serviceTimeSavedHours: number; // Weekly
  numberOfStopsToAdd: number;
}

export interface LaborOutputs {
  fullyLoadedWeeklyCost: number;
  fullyLoadedMonthlyCost: number;
  incrementalMonthlyProfitImpact: number;
  costPerAdditionalStop: number;
  monthsToBreakeven: number;
}

export function calculateLabor(inputs: LaborInputs): LaborOutputs {
  const {
    hourlyWage,
    hoursPerWeek,
    payrollBurdenPct = 15,
    expectedRouteRevenueIncrease,
    numberOfStopsToAdd
  } = inputs;

  const fullyLoadedHourlyRate = hourlyWage * (1 + (payrollBurdenPct / 100));
  const fullyLoadedWeeklyCost = fullyLoadedHourlyRate * hoursPerWeek;
  
  // Assume 4.33 weeks per month
  const wksPerMonth = 4.33;
  const fullyLoadedMonthlyCost = fullyLoadedWeeklyCost * wksPerMonth;

  // We assume some variable margin on the new revenue. E.g 45% Net ops margin before labor.
  // We'll require it to be passed or just assume full impact as an approximation. 
  // Let's assume gross margin is 50%, so profit impact = (Rev Increase * 0.50) - Labor Cost
  const assumedGrossMargin = 0.50; 
  const incrementalMonthlyProfitImpact = (expectedRouteRevenueIncrease * assumedGrossMargin) - fullyLoadedMonthlyCost;

  const costPerAdditionalStop = numberOfStopsToAdd > 0 ? (fullyLoadedWeeklyCost / numberOfStopsToAdd) : 0;

  // Breakeven point
  // The monthly profit impact vs the upfront cost of hiring/training (if we had it, otherwise it's just > 0)
  // Let's frame breakeven as the required monthly revenue increase to cleanly cover the cost at 50% margin
  const requiredRevenueToCover = fullyLoadedMonthlyCost / assumedGrossMargin;
  const monthsToBreakeven = expectedRouteRevenueIncrease > 0 ? (requiredRevenueToCover / expectedRouteRevenueIncrease) : Infinity;

  return {
    fullyLoadedWeeklyCost: Number(fullyLoadedWeeklyCost.toFixed(2)),
    fullyLoadedMonthlyCost: Number(fullyLoadedMonthlyCost.toFixed(2)),
    incrementalMonthlyProfitImpact: Number(incrementalMonthlyProfitImpact.toFixed(2)),
    costPerAdditionalStop: Number(costPerAdditionalStop.toFixed(2)),
    monthsToBreakeven: Number(monthsToBreakeven.toFixed(1))
  };
}
