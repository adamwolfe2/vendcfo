export interface RevShareInputs {
  grossSales: number;
  revShareType: 'flat' | 'tiered';
  commissionPct: number; 
  thresholdAmount?: number; // Needed if tiered
}

export interface RevShareOutputs {
  totalPayoutToLocation: number;
  netRevenueRetainedByOperator: number;
  effectiveMarginAfterRevSharePct: number;
  revShareAsPctOfGrossMargin: number;
}

export function calculateRevShare(inputs: RevShareInputs): RevShareOutputs {
  const {
    grossSales,
    revShareType,
    commissionPct,
    thresholdAmount = 0
  } = inputs;

  let totalPayoutToLocation = 0;

  if (revShareType === 'flat') {
    totalPayoutToLocation = grossSales * (commissionPct / 100);
  } else if (revShareType === 'tiered') {
    if (grossSales > thresholdAmount) {
      // Assuming it applies only to amount ABOVE the threshold based on standard PRD phrasing
      totalPayoutToLocation = (grossSales - thresholdAmount) * (commissionPct / 100);
    }
  }

  const netRevenueRetainedByOperator = grossSales - totalPayoutToLocation;

  const effectiveMarginAfterRevSharePct = grossSales > 0 ? (netRevenueRetainedByOperator / grossSales) * 100 : 0;

  // Assuming a standard 50% gross margin for this alert metric
  const assumedGrossMargin = grossSales * 0.50; 
  const revShareAsPctOfGrossMargin = assumedGrossMargin > 0 ? (totalPayoutToLocation / assumedGrossMargin) * 100 : 0;

  return {
    totalPayoutToLocation: Number(totalPayoutToLocation.toFixed(2)),
    netRevenueRetainedByOperator: Number(netRevenueRetainedByOperator.toFixed(2)),
    effectiveMarginAfterRevSharePct: Number(effectiveMarginAfterRevSharePct.toFixed(2)),
    revShareAsPctOfGrossMargin: Number(revShareAsPctOfGrossMargin.toFixed(2))
  };
}
