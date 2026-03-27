import { CalculatorWidgetInner } from "@/components/embed/calculator-widget";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VendCFO Calculators",
};

export default function EmbedCalculatorsPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <CalculatorWidgetInner embedded />
    </div>
  );
}
