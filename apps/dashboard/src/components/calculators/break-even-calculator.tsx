"use client";

import React, { useState } from 'react';
import { calculateBreakEven, BreakEvenInputs, BreakEvenOutputs } from '@vendcfo/calculators';
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";

export function BreakEvenCalculator() {
  const [inputs, setInputs] = useState<BreakEvenInputs>({
    fixedMonthlyCostsGlobal: 5000, avgGrossMarginPct: 45, perLocationFixedCostsAvg: 100, monthlyDebtObligations: 1200,
  });

  const results: BreakEvenOutputs = calculateBreakEven(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4"><CardTitle>Break-Even Analysis</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="be-fixed">Global Fixed Costs</Label><Input type="number" id="be-fixed" name="fixedMonthlyCostsGlobal" value={inputs.fixedMonthlyCostsGlobal} onChange={handleChange} className="mt-1" /></div>
            <div><Label htmlFor="be-margin">Avg Gross Margin (%)</Label><Input type="number" id="be-margin" name="avgGrossMarginPct" value={inputs.avgGrossMarginPct} onChange={handleChange} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="be-loc">Fixed Cost / Location</Label><Input type="number" id="be-loc" name="perLocationFixedCostsAvg" value={inputs.perLocationFixedCostsAvg} onChange={handleChange} className="mt-1" /></div>
            <div><Label htmlFor="be-debt">Monthly Debt ($)</Label><Input type="number" id="be-debt" name="monthlyDebtObligations" value={inputs.monthlyDebtObligations} onChange={handleChange} className="mt-1" /></div>
          </div>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Break-Even Target</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Revenue Required / Mo:</span><span className="font-bold text-blue-600 dark:text-blue-400">${results.totalRevenueRequired.toLocaleString()}</span></div>
            <div className="flex justify-between pt-2 border-t border-border"><span className="text-muted-foreground">Locations Required:</span><span className="font-medium text-foreground">{results.locationsRequiredToBreakEven === Infinity ? 'Unreachable' : Math.ceil(results.locationsRequiredToBreakEven).toLocaleString()}</span></div>
          </div>
          {results.locationsRequiredToBreakEven === Infinity && (
            <div className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded">
              <strong>Warning:</strong> Locations are losing money on a unit basis. Break-even impossible without margin improvement.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
