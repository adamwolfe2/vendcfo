"use client";

import React, { useState } from 'react';
import { calculateMargin, MarginInputs, MarginOutputs } from '@vendcfo/calculators';
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";

export function MarginCalculator() {
  const [inputs, setInputs] = useState<MarginInputs>({
    unitCost: 1.00,
    retailPrice: 2.00,
    merchantFeePct: 2.75,
    revSharePct: 15,
  });

  const results: MarginOutputs = calculateMargin(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev: MarginInputs) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle>Margin Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="unitCost">Unit Cost ($)</Label>
            <Input type="number" id="unitCost" name="unitCost" value={inputs.unitCost} onChange={handleChange} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="retailPrice">Retail Price ($)</Label>
            <Input type="number" id="retailPrice" name="retailPrice" value={inputs.retailPrice} onChange={handleChange} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="merchantFeePct">Merchant Fee (%)</Label>
              <Input type="number" id="merchantFeePct" name="merchantFeePct" value={inputs.merchantFeePct} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="revSharePct">Rev Share (%)</Label>
              <Input type="number" id="revSharePct" name="revSharePct" value={inputs.revSharePct} onChange={handleChange} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Results</h3>
          <div className="grid grid-cols-2 gap-y-3 font-mono text-sm">
            <div className="text-muted-foreground">Net Profit</div>
            <div className="text-right font-medium text-green-600 dark:text-green-400">${results.netProfitPerUnit}</div>
            <div className="text-muted-foreground">Gross Margin</div>
            <div className={`text-right font-bold ${results.grossMarginPct < 30 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {results.grossMarginPct}%
            </div>
            <div className="text-muted-foreground">Break Even</div>
            <div className="text-right text-foreground">${results.breakEvenPrice}</div>
          </div>
          
          {results.grossMarginPct < 30 && (
            <div className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded">
              Warning: Margin below 30%. Raise price to ${results.suggestedPrices.margin35} for 35%.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
