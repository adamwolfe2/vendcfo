import type { Metadata } from "next";
import { AskRouteCFO } from "@/components/ask-route-cfo";
import { BreakEvenCalculator } from "@/components/calculators/break-even-calculator";
import { CashFlowCalculator } from "@/components/calculators/cash-flow-calculator";
import { EquipmentFinancingCalculator } from "@/components/calculators/equipment-financing-calculator";
import { LaborCalculator } from "@/components/calculators/labor-calculator";
import { MarginCalculator } from "@/components/calculators/margin-calculator";
import { MarkupCalculator } from "@/components/calculators/markup-calculator";
import { ProductMixCalculator } from "@/components/calculators/product-mix-calculator";
import { RevShareCalculator } from "@/components/calculators/rev-share-calculator";
import { RouteProfitCalculator } from "@/components/calculators/route-profit-calculator";

export const metadata: Metadata = { title: "Calculators | VendCFO" };

export default function CalculatorsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">
          VendCFO Calculators
        </h1>
        <AskRouteCFO
          prompt="I'm on the calculators page. Help me figure out which calculator to use and walk me through it with my real business data."
          label="Ask Route CFO for help"
        />
      </div>
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
