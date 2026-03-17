export interface MarginInputs {
  unitCost: number;
  retailPrice: number;
  taxRatePct?: number; // Optional
  spoilagePct?: number; // Optional
  merchantFeePct?: number; // Default: 2.75%
  revSharePct?: number; // Optional
}

export interface MarginOutputs {
  grossProfitDollars: number;
  grossMarginPct: number;
  markupPct: number;
  netProfitPerUnit: number;
  breakEvenPrice: number;
  suggestedPrices: {
    margin30: number;
    margin35: number;
    margin40: number;
    margin45: number;
  };
}

export function calculateMargin(inputs: MarginInputs): MarginOutputs {
  const {
    unitCost,
    retailPrice,
    taxRatePct = 0,
    spoilagePct = 0,
    merchantFeePct = 2.75,
    revSharePct = 0,
  } = inputs;

  const totalFeesPct = (taxRatePct + spoilagePct + merchantFeePct + revSharePct) / 100;
  
  // Total deducted amount per item sold based on sale price
  const totalFeesDollars = retailPrice * totalFeesPct;

  const netProfitPerUnit = retailPrice - unitCost - totalFeesDollars;
  const grossProfitDollars = retailPrice - unitCost;
  
  // Margin = (Price - Cost - Fees) / Price
  const grossMarginPct = (netProfitPerUnit / retailPrice) * 100;
  
  const markupPct = ((retailPrice - unitCost) / unitCost) * 100;

  // Break-even price formula: Unit Cost / (1 - all fee %s)
  const breakEvenPrice = unitCost / (1 - totalFeesPct);

  const calculateTargetPrice = (targetMarginPct: number) => {
    // targetMargin = (Price - Cost - Price * totalFeesPct) / Price
    // Price * targetMargin = Price - Cost - Price * totalFeesPct
    // Cost = Price * (1 - totalFeesPct - targetMargin)
    // Price = Cost / (1 - totalFeesPct - targetMargin)
    return unitCost / (1 - totalFeesPct - (targetMarginPct / 100));
  };

  return {
    grossProfitDollars,
    grossMarginPct: Number(grossMarginPct.toFixed(2)),
    markupPct: Number(markupPct.toFixed(2)),
    netProfitPerUnit: Number(netProfitPerUnit.toFixed(2)),
    breakEvenPrice: Number(breakEvenPrice.toFixed(2)),
    suggestedPrices: {
      margin30: Number(calculateTargetPrice(30).toFixed(2)),
      margin35: Number(calculateTargetPrice(35).toFixed(2)),
      margin40: Number(calculateTargetPrice(40).toFixed(2)),
      margin45: Number(calculateTargetPrice(45).toFixed(2)),
    }
  };
}
