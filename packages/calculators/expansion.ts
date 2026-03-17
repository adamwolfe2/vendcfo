export interface ExpansionInputs {
  newMachineCost: number;
  installSetupCost: number;
  expectedMonthlyGrossSales: number;
  expectedCogs: number;
  expectedMonthlyServicingCost: number;
  laborImpactHoursMonthly: number;
  confidenceScore: number; // 1-5
}

export interface ExpansionOutputs {
  projectedMonthlyNetProfit: number;
  paybackPeriodMonths: number;
  bestCaseProfit: number;
  worstCaseProfit: number;
  expansionViabilityScore: number;
}

export function calculateExpansion(inputs: ExpansionInputs): ExpansionOutputs {
  const {
    newMachineCost,
    installSetupCost,
    expectedMonthlyGrossSales,
    expectedCogs,
    expectedMonthlyServicingCost,
    laborImpactHoursMonthly,
    confidenceScore
  } = inputs;

  const assumedLaborCostPerHour = 25;
  const monthlyLaborCost = laborImpactHoursMonthly * assumedLaborCostPerHour;

  const totalUpfrontCost = newMachineCost + installSetupCost;

  const projectedMonthlyNetProfit = expectedMonthlyGrossSales - expectedCogs - expectedMonthlyServicingCost - monthlyLaborCost;

  const paybackPeriodMonths = projectedMonthlyNetProfit > 0 ? (totalUpfrontCost / projectedMonthlyNetProfit) : Infinity;

  // Best/Worst case based on PRD +/- 20% revenue
  const bestCaseRevenue = expectedMonthlyGrossSales * 1.2;
  const bestCaseProfit = bestCaseRevenue - expectedCogs - expectedMonthlyServicingCost - monthlyLaborCost;

  const worstCaseRevenue = expectedMonthlyGrossSales * 0.8;
  const worstCaseProfit = worstCaseRevenue - expectedCogs - expectedMonthlyServicingCost - monthlyLaborCost;

  // Score 0-100 based on payback, confidence, and absolute profit
  let viabilityScore = 50;
  if (confidenceScore >= 4) viabilityScore += 15;
  if (confidenceScore <= 2) viabilityScore -= 15;

  if (paybackPeriodMonths < 12) viabilityScore += 20;
  else if (paybackPeriodMonths > 24) viabilityScore -= 20;

  if (projectedMonthlyNetProfit > 200) viabilityScore += 15;

  return {
    projectedMonthlyNetProfit: Number(projectedMonthlyNetProfit.toFixed(2)),
    paybackPeriodMonths: Number(paybackPeriodMonths.toFixed(1)),
    bestCaseProfit: Number(bestCaseProfit.toFixed(2)),
    worstCaseProfit: Number(worstCaseProfit.toFixed(2)),
    expansionViabilityScore: Math.max(0, Math.min(100, viabilityScore))
  };
}
