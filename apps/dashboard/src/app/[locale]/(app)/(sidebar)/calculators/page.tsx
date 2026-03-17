import { MarginCalculator } from '@/components/calculators/margin-calculator';
import { LaborCalculator } from '@/components/calculators/labor-calculator';
import { CashFlowCalculator } from '@/components/calculators/cash-flow-calculator';
import { RouteProfitCalculator } from '@/components/calculators/route-profit-calculator';
import { MarkupCalculator } from '@/components/calculators/markup-calculator';
import { ProductMixCalculator } from '@/components/calculators/product-mix-calculator';
import { RevShareCalculator } from '@/components/calculators/rev-share-calculator';
import { BreakEvenCalculator } from '@/components/calculators/break-even-calculator';
import { EquipmentFinancingCalculator } from '@/components/calculators/equipment-financing-calculator';

export default function CalculatorsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">VendCFO Calculators</h1>
      <p className="text-gray-600 mb-8">Model your vending operations using these specialized tools.</p>
      
      <div className="flex flex-wrap gap-8 items-start">
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
