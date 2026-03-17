export interface PriceChangeInputs {
  currentRetailPrice: number;
  proposedNewPrice: number;
  currentMonthlyUnitSales: number;
  assumedElasticityDeclinePct?: number; // per $0.25 increment
  unitCost: number; // Need this to calculate profit correctly
}

export interface PriceChangeOutputs {
  projectedNewMonthlyRevenue: number;
  projectedNewGrossProfit: number;
  downsideScenarioProfit: number;
  upsideScenarioProfit: number;
  recommendation: 'raise' | 'hold' | 'lower';
}

export function calculatePriceChange(inputs: PriceChangeInputs): PriceChangeOutputs {
  const {
    currentRetailPrice,
    proposedNewPrice,
    currentMonthlyUnitSales,
    assumedElasticityDeclinePct = 5,
    unitCost
  } = inputs;

  const currentGrossProfit = currentMonthlyUnitSales * (currentRetailPrice - unitCost);

  // Calculate elasticity: assume the decline pct happens for every $0.25 increase
  const priceDifference = proposedNewPrice - currentRetailPrice;
  const incrementsOf25Cents = priceDifference / 0.25;
  const totalExpectedVolumeDeclinePct = Math.max(0, incrementsOf25Cents * assumedElasticityDeclinePct);

  // Base case
  const expectedNewVolume = currentMonthlyUnitSales * (1 - (totalExpectedVolumeDeclinePct / 100));
  const projectedNewMonthlyRevenue = expectedNewVolume * proposedNewPrice;
  const projectedNewGrossProfit = expectedNewVolume * (proposedNewPrice - unitCost);

  // Upside: volume holds at current
  const upsideScenarioProfit = currentMonthlyUnitSales * (proposedNewPrice - unitCost);

  // Downside: volume drops 1.5x the expected decline
  const downsideVolume = currentMonthlyUnitSales * (1 - ((totalExpectedVolumeDeclinePct * 1.5) / 100));
  const downsideScenarioProfit = Math.max(0, downsideVolume) * (proposedNewPrice - unitCost);

  let recommendation: 'raise' | 'hold' | 'lower' = 'hold';
  if (projectedNewGrossProfit > currentGrossProfit && downsideScenarioProfit > (currentGrossProfit * 0.95)) {
    recommendation = 'raise';
  } else if (proposedNewPrice < currentRetailPrice && projectedNewGrossProfit > currentGrossProfit) {
    recommendation = 'lower';
  }

  return {
    projectedNewMonthlyRevenue: Number(projectedNewMonthlyRevenue.toFixed(2)),
    projectedNewGrossProfit: Number(projectedNewGrossProfit.toFixed(2)),
    downsideScenarioProfit: Number(downsideScenarioProfit.toFixed(2)),
    upsideScenarioProfit: Number(upsideScenarioProfit.toFixed(2)),
    recommendation
  };
}
