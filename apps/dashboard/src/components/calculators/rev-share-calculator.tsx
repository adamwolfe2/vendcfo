"use client";

import React, { useState } from 'react';
import { calculateRevShare, RevShareInputs, RevShareOutputs } from '@vendcfo/calculators';
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";

export function RevShareCalculator() {
  const [inputs, setInputs] = useState<RevShareInputs>({
    grossSales: 1000, revShareType: 'flat', commissionPct: 10, thresholdAmount: 500,
  });

  const results: RevShareOutputs = calculateRevShare(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: name === 'revShareType' ? value : (parseFloat(value) || 0) }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4"><CardTitle>Revenue Share Calculator</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div><Label htmlFor="rs-grossSales">Monthly Gross Sales ($)</Label><Input type="number" id="rs-grossSales" name="grossSales" value={inputs.grossSales} onChange={handleChange} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rs-type">Commission Type</Label>
              <select id="rs-type" name="revShareType" value={inputs.revShareType} onChange={handleChange} className="w-full mt-1 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground">
                <option value="flat">Flat %</option>
                <option value="tiered">Tiered (Above $)</option>
              </select>
            </div>
            <div><Label htmlFor="rs-pct">Commission (%)</Label><Input type="number" id="rs-pct" name="commissionPct" value={inputs.commissionPct} onChange={handleChange} className="mt-1" /></div>
          </div>
          {inputs.revShareType === 'tiered' && (
            <div>
              <Label htmlFor="rs-threshold">Threshold Amount ($)</Label>
              <Input type="number" id="rs-threshold" name="thresholdAmount" value={inputs.thresholdAmount} onChange={handleChange} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Commission applies only above this amount.</p>
            </div>
          )}
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Payout & Impact</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Payout:</span><span className="font-bold text-red-500">${results.totalPayoutToLocation.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Net Retained:</span><span className="text-green-600">${results.netRevenueRetainedByOperator.toLocaleString()}</span></div>
            <div className="flex justify-between pt-2 border-t border-border"><span className="text-muted-foreground">Margin Risk:</span><span className={`font-medium ${results.revShareAsPctOfGrossMargin > 30 ? 'text-red-500' : 'text-foreground'}`}>{results.revShareAsPctOfGrossMargin.toFixed(1)}% of Gross Profit</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
