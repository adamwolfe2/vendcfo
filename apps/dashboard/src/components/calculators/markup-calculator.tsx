"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";
import type React from "react";
import { useState } from "react";

export function MarkupCalculator() {
  const [inputs, setInputs] = useState({
    unitCost: 0.85,
    desiredMarkupPct: 100,
  });
  const sellingPrice = inputs.unitCost * (1 + inputs.desiredMarkupPct / 100);
  const grossProfit = sellingPrice - inputs.unitCost;
  const marginPct = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle>Markup Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="mc-unitCost">Unit Cost ($)</Label>
            <Input
              type="number"
              id="mc-unitCost"
              name="unitCost"
              value={inputs.unitCost}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="mc-markupPct">Desired Markup (%)</Label>
            <Input
              type="number"
              id="mc-markupPct"
              name="desiredMarkupPct"
              value={inputs.desiredMarkupPct}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
            Results
          </h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selling Price:</span>
              <span className="font-bold text-foreground">
                ${sellingPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Profit:</span>
              <span className="text-green-600">${grossProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Effective Margin:</span>
              <span className="font-medium text-foreground">
                {marginPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
