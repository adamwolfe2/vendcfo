export interface MarkupInputs {
  costPerUnit: number;
  targetMarginPct: number;
  competitorPrice?: number;
  locationType: 'office' | 'school' | 'gym' | 'transit' | 'other';
  expectedMonthlyVolume: number;
}

export interface MarkupOutputs {
  recommendedRetailPrice: number;
  projectedGrossProfit: number;
  projectedMonthlyProfit: number;
  sensitivityTable: {
    minus50Cents: number;
    minus25Cents: number;
    plus25Cents: number;
    plus50Cents: number;
  };
}

export function calculateMarkup(inputs: MarkupInputs): MarkupOutputs {
  const {
    costPerUnit,
    targetMarginPct,
    expectedMonthlyVolume
  } = inputs;

  // Target Margin = (Price - Cost) / Price
  // Price = Cost / (1 - TargetMargin)
  const marginDec = targetMarginPct / 100;
  const baseRecommendedPrice = costPerUnit / (1 - marginDec);

  // Round up to nearest quarter for vending
  const recommendedRetailPrice = Math.ceil(baseRecommendedPrice * 4) / 4;

  const projectedGrossProfit = recommendedRetailPrice - costPerUnit;
  const projectedMonthlyProfit = projectedGrossProfit * expectedMonthlyVolume;

  const calculateSensitivity = (diff: number) => {
    return ((recommendedRetailPrice + diff) - costPerUnit) * expectedMonthlyVolume;
  };

  return {
    recommendedRetailPrice: Number(recommendedRetailPrice.toFixed(2)),
    projectedGrossProfit: Number(projectedGrossProfit.toFixed(2)),
    projectedMonthlyProfit: Number(projectedMonthlyProfit.toFixed(2)),
    sensitivityTable: {
      minus50Cents: Number(calculateSensitivity(-0.50).toFixed(2)),
      minus25Cents: Number(calculateSensitivity(-0.25).toFixed(2)),
      plus25Cents: Number(calculateSensitivity(0.25).toFixed(2)),
      plus50Cents: Number(calculateSensitivity(0.50).toFixed(2)),
    }
  };
}
