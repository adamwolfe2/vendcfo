export interface ProductMixInputs {
  skus: {
    id: string;
    unitCost: number;
    retailPrice: number;
    unitsSoldPerMonth: number;
    spoilagePct: number;
    slotsOccupied: number;
    refillFrequency: number; // times per month
  }[];
}

export interface SkuOutput {
  id: string;
  grossMarginPct: number;
  grossProfitDollars: number;
  profitPerSlot: number;
  isLowPerforming: boolean;
}

export interface ProductMixOutputs {
  skuResults: SkuOutput[];
}

export function calculateProductMix(inputs: ProductMixInputs): ProductMixOutputs {
  const results = inputs.skus.map(sku => {
    // Spoilage affects actual cost of goods
    const spoiledUnits = sku.unitsSoldPerMonth * (sku.spoilagePct / 100);
    const totalUnitCostSum = (sku.unitsSoldPerMonth + spoiledUnits) * sku.unitCost;
    
    const grossRevenue = sku.unitsSoldPerMonth * sku.retailPrice;
    const grossProfitDollars = grossRevenue - totalUnitCostSum;
    
    const grossMarginPct = grossRevenue > 0 ? (grossProfitDollars / grossRevenue) * 100 : 0;
    
    const profitPerSlot = sku.slotsOccupied > 0 ? (grossProfitDollars / sku.slotsOccupied) : 0;

    const isLowPerforming = grossMarginPct < 25; // per PRD alert rule

    return {
      id: sku.id,
      grossMarginPct: Number(grossMarginPct.toFixed(2)),
      grossProfitDollars: Number(grossProfitDollars.toFixed(2)),
      profitPerSlot: Number(profitPerSlot.toFixed(2)),
      isLowPerforming
    };
  });

  return { skuResults: results };
}
