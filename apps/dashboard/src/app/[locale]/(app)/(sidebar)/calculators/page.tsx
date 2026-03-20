import { BreakEvenCalculator } from "@/components/calculators/break-even-calculator";
import { CashFlowCalculator } from "@/components/calculators/cash-flow-calculator";
import { EquipmentFinancingCalculator } from "@/components/calculators/equipment-financing-calculator";
import { LaborCalculator } from "@/components/calculators/labor-calculator";
import { MarginCalculator } from "@/components/calculators/margin-calculator";
import { MarkupCalculator } from "@/components/calculators/markup-calculator";
import { ProductMixCalculator } from "@/components/calculators/product-mix-calculator";
import { RevShareCalculator } from "@/components/calculators/rev-share-calculator";
import { RouteProfitCalculator } from "@/components/calculators/route-profit-calculator";

export default function CalculatorsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-foreground mb-2">
        VendCFO Calculators
      </h1>
      <p className="text-muted-foreground mb-8">
        Model your vending operations using these specialized tools.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        <MarginCalculator />
        <MarkupCalculator />
        <CashFlowCalculator />
        <RouteProfitCalculator />
        <LaborCalculator />
        <ProductMixCalculator />
        <EquipmentFinancingCalculator />
        <BreakEvenCalculator />
        <RevShareCalculator />
      </div>
    </div>
  );
}
