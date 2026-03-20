"use client";

import {
  type EquipmentFinancingInputs,
  type EquipmentFinancingOutputs,
  calculateEquipmentFinancing,
} from "@vendcfo/calculators";
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";
import type React from "react";
import { useState } from "react";

export function EquipmentFinancingCalculator() {
  const [inputs, setInputs] = useState<EquipmentFinancingInputs>({
    equipmentPrice: 4500,
    downPayment: 500,
    apr: 8.5,
    termMonths: 36,
    expectedMonthlyGrossRevenue: 600,
    expectedMonthlyCogs: 240,
    expectedRevSharePct: 10,
    expectedMonthlyServicingCost: 75,
  });

  const results: EquipmentFinancingOutputs =
    calculateEquipmentFinancing(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle>Equipment ROI & Financing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ef-price">Machine Price ($)</Label>
              <Input
                type="number"
                id="ef-price"
                name="equipmentPrice"
                value={inputs.equipmentPrice}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ef-down">Down Payment ($)</Label>
              <Input
                type="number"
                id="ef-down"
                name="downPayment"
                value={inputs.downPayment}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ef-apr">Loan APR (%)</Label>
              <Input
                type="number"
                id="ef-apr"
                name="apr"
                value={inputs.apr}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ef-term">Term (Months)</Label>
              <Input
                type="number"
                id="ef-term"
                name="termMonths"
                value={inputs.termMonths}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
            <div>
              <Label htmlFor="ef-rev">Target Rev / Mo</Label>
              <Input
                type="number"
                id="ef-rev"
                name="expectedMonthlyGrossRevenue"
                value={inputs.expectedMonthlyGrossRevenue}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ef-cogs">Est COGS / Mo</Label>
              <Input
                type="number"
                id="ef-cogs"
                name="expectedMonthlyCogs"
                value={inputs.expectedMonthlyCogs}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
            Investment Analysis
          </h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Payment:</span>
              <span className="font-medium text-red-500">
                ${results.monthlyPayment.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Net Cash Impact / Mo:
              </span>
              <span
                className={`font-bold ${results.cashOnCashMonthlyImpact > 0 ? "text-green-600" : "text-red-500"}`}
              >
                {results.cashOnCashMonthlyImpact > 0 ? "+" : ""}$
                {results.cashOnCashMonthlyImpact.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">ROI Payback:</span>
              <span className="font-medium text-foreground">
                {results.monthsToPayback === Number.POSITIVE_INFINITY
                  ? "Never"
                  : `${results.monthsToPayback.toFixed(1)} months`}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
