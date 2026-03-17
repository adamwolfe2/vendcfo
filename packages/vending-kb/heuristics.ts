import { VENDING_BENCHMARKS } from './benchmarks';

export function checkMarginHealth(marginPct: number, category: 'beverages' | 'snacks' | 'freshFood' = 'snacks') {
  const benchmark = VENDING_BENCHMARKS.margins[category];
  if (marginPct < benchmark.min) return 'unhealthy';
  if (marginPct > benchmark.max) return 'excellent';
  return 'healthy';
}

export function checkPaybackViability(monthsToPayback: number) {
  if (monthsToPayback < VENDING_BENCHMARKS.machinePaybackWindowMonths.good) return 'good';
  if (monthsToPayback > VENDING_BENCHMARKS.machinePaybackWindowMonths.risky) return 'risky';
  return 'acceptable';
}

export function checkLaborHealth(laborPct: number, isOwnerOperated: boolean = false) {
  const max = isOwnerOperated 
    ? VENDING_BENCHMARKS.targetLaborCostPct.ownerOperated 
    : VENDING_BENCHMARKS.targetLaborCostPct.staffedRoute;
  
  if (laborPct > max) return 'high';
  return 'healthy';
}
