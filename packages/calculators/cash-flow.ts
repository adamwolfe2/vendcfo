export interface CashFlowInputs {
  currentCashBalance: number;
  recurringFixedExpensesMonthly: number;
  variableExpensesAvgPct: number;
  debtPaymentsMonthly: number;
  projectedMonthlySales: number;
  seasonalityAdjustmentPct?: number;
}

export interface CashFlowOutputs {
  projectedBalance30Days: number;
  projectedBalance60Days: number;
  projectedBalance90Days: number;
  burnRate: number;
  runwayMonths: number;
  safeSpendThreshold: number;
  isRunwayCritical: boolean;
}

export function calculateCashFlow(inputs: CashFlowInputs): CashFlowOutputs {
  const {
    currentCashBalance,
    recurringFixedExpensesMonthly,
    variableExpensesAvgPct,
    debtPaymentsMonthly,
    projectedMonthlySales,
    seasonalityAdjustmentPct = 0
  } = inputs;

  const adjustedMonthlySales = projectedMonthlySales * (1 + (seasonalityAdjustmentPct / 100));
  const variableExpensesMonthly = adjustedMonthlySales * (variableExpensesAvgPct / 100);
  
  const totalMonthlyOutflow = recurringFixedExpensesMonthly + variableExpensesMonthly + debtPaymentsMonthly;
  const netMonthlyCashFlow = adjustedMonthlySales - totalMonthlyOutflow;

  const projectedBalance30Days = currentCashBalance + netMonthlyCashFlow;
  const projectedBalance60Days = currentCashBalance + (netMonthlyCashFlow * 2);
  const projectedBalance90Days = currentCashBalance + (netMonthlyCashFlow * 3);

  const burnRate = netMonthlyCashFlow < 0 ? Math.abs(netMonthlyCashFlow) : 0;
  
  const runwayMonths = burnRate > 0 ? (currentCashBalance / burnRate) : Infinity;

  // Safe spend threshold: How much can we spend without threatening 3 months of runway?
  // We want: currentCashBalance - (3 * burnRate) - safeSpend = 0 (assuming no future revenue changes)
  const bufferMonths = 3;
  const minRequiredCash = totalMonthlyOutflow * bufferMonths;
  const safeSpendThreshold = Math.max(0, currentCashBalance - minRequiredCash);

  const isRunwayCritical = runwayMonths < 1; // Or if balance drops below 0 in 21 days
  
  return {
    projectedBalance30Days: Number(projectedBalance30Days.toFixed(2)),
    projectedBalance60Days: Number(projectedBalance60Days.toFixed(2)),
    projectedBalance90Days: Number(projectedBalance90Days.toFixed(2)),
    burnRate: Number(burnRate.toFixed(2)),
    runwayMonths: Number(runwayMonths.toFixed(1)),
    safeSpendThreshold: Number(safeSpendThreshold.toFixed(2)),
    isRunwayCritical
  };
}
