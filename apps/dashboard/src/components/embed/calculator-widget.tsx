"use client";

import { BreakEvenCalculator } from "@/components/calculators/break-even-calculator";
import { CashFlowCalculator } from "@/components/calculators/cash-flow-calculator";
import { EquipmentFinancingCalculator } from "@/components/calculators/equipment-financing-calculator";
import { LaborCalculator } from "@/components/calculators/labor-calculator";
import { MarginCalculator } from "@/components/calculators/margin-calculator";
import { MarkupCalculator } from "@/components/calculators/markup-calculator";
import { ProductMixCalculator } from "@/components/calculators/product-mix-calculator";
import { RevShareCalculator } from "@/components/calculators/rev-share-calculator";
import { RouteProfitCalculator } from "@/components/calculators/route-profit-calculator";
import { ArrowLeft, Calculator, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface CalculatorEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
}

const CALCULATORS: readonly CalculatorEntry[] = [
  {
    id: "margin",
    name: "Margin Calculator",
    description: "Calculate net profit and gross margin per unit",
    icon: "M",
  },
  {
    id: "markup",
    name: "Markup Calculator",
    description: "Convert markup percentage to selling price",
    icon: "U",
  },
  {
    id: "break-even",
    name: "Break-Even Analysis",
    description: "Find revenue needed to cover all costs",
    icon: "B",
  },
  {
    id: "cash-flow",
    name: "Cash Flow Forecast",
    description: "Project monthly cash flow and runway",
    icon: "C",
  },
  {
    id: "equipment",
    name: "Equipment ROI",
    description: "Analyze financing and payback for machines",
    icon: "E",
  },
  {
    id: "labor",
    name: "Labor Calculator",
    description: "Calculate fully loaded labor costs",
    icon: "L",
  },
  {
    id: "product-mix",
    name: "Product Mix",
    description: "Analyze blended margin across products",
    icon: "P",
  },
  {
    id: "rev-share",
    name: "Revenue Share",
    description: "Model commission payouts and margin impact",
    icon: "R",
  },
  {
    id: "route-profit",
    name: "Route Profitability",
    description: "Calculate per-route and per-stop profit",
    icon: "T",
  },
] as const;

function CalculatorRenderer({ id }: { readonly id: string }) {
  switch (id) {
    case "margin":
      return <MarginCalculator />;
    case "markup":
      return <MarkupCalculator />;
    case "break-even":
      return <BreakEvenCalculator />;
    case "cash-flow":
      return <CashFlowCalculator />;
    case "equipment":
      return <EquipmentFinancingCalculator />;
    case "labor":
      return <LaborCalculator />;
    case "product-mix":
      return <ProductMixCalculator />;
    case "rev-share":
      return <RevShareCalculator />;
    case "route-profit":
      return <RouteProfitCalculator />;
    default:
      return null;
  }
}

interface CalculatorListProps {
  readonly onSelect: (id: string) => void;
}

function CalculatorList({ onSelect }: CalculatorListProps) {
  return (
    <div className="grid grid-cols-1 gap-2 p-4">
      {CALCULATORS.map((calc) => (
        <button
          key={calc.id}
          type="button"
          onClick={() => onSelect(calc.id)}
          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-secondary/80 transition-colors text-left group"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            {calc.icon}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {calc.name}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {calc.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

interface CalculatorWidgetInnerProps {
  readonly embedded?: boolean;
}

export function CalculatorWidgetInner({
  embedded = false,
}: CalculatorWidgetInnerProps) {
  const [selectedCalculator, setSelectedCalculator] = useState<string | null>(
    null,
  );

  const selectedEntry = CALCULATORS.find((c) => c.id === selectedCalculator);

  const handleBack = useCallback(() => {
    setSelectedCalculator(null);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedCalculator(id);
  }, []);

  // Listen for postMessage from parent for programmatic control
  useEffect(() => {
    if (!embedded) return;

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "vendcfo:select-calculator") {
        const id = event.data.calculator as string;
        const match = CALCULATORS.find((c) => c.id === id);
        if (match) {
          setSelectedCalculator(id);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [embedded]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          {selectedCalculator ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">
                VendCFO Calculators
              </span>
            </div>
          )}
          {selectedEntry && (
            <span className="text-sm font-medium text-foreground ml-auto">
              {selectedEntry.name}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedCalculator ? (
          <div className="p-4 flex justify-center">
            <CalculatorRenderer id={selectedCalculator} />
          </div>
        ) : (
          <CalculatorList onSelect={handleSelect} />
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border bg-secondary/30 px-4 py-2">
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span>Powered by</span>
          <a
            href="https://vendcfo.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            VendCFO
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Standalone floating widget for use within the dashboard app itself.
 * For external embedding, use the iframe approach via calculator-widget.js.
 */
export function CalculatorWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
        aria-label={isOpen ? "Close calculators" : "Open calculators"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Calculator className="h-6 w-6" />
        )}
      </button>

      {/* Popup panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-xl border border-border shadow-2xl overflow-hidden bg-background">
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <CalculatorWidgetInner />
        </div>
      )}
    </>
  );
}
