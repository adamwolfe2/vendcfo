"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";

export function CashFlowCalculator() {
  const [inputs, setInputs] = useState({
    monthlyRevenue: 12000,
    monthlyCogs: 5400,
    fixedCosts: 3000,
    loanPayments: 800,
    currentCash: 15000,
  });

  const monthlyNet = inputs.monthlyRevenue - inputs.monthlyCogs - inputs.fixedCosts - inputs.loanPayments;
  const runwayMonths = monthlyNet < 0 ? (inputs.currentCash / Math.abs(monthlyNet)) : Infinity;
  const annualizedCashFlow = monthlyNet * 12;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle>Cash Flow Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="monthlyRevenue">Revenue / Mo</Label><Input type="number" id="monthlyRevenue" name="monthlyRevenue" value={inputs.monthlyRevenue} onChange={handleChange} className="mt-1" /></div>
            <div><Label htmlFor="monthlyCogs">COGS / Mo</Label><Input type="number" id="monthlyCogs" name="monthlyCogs" value={inputs.monthlyCogs} onChange={handleChange} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="fixedCosts">Fixed Costs / Mo</Label><Input type="number" id="fixedCosts" name="fixedCosts" value={inputs.fixedCosts} onChange={handleChange} className="mt-1" /></div>
            <div><Label htmlFor="loanPayments">Loan Payments / Mo</Label><Input type="number" id="loanPayments" name="loanPayments" value={inputs.loanPayments} onChange={handleChange} className="mt-1" /></div>
          </div>
          <div><Label htmlFor="currentCash">Current Cash on Hand</Label><Input type="number" id="currentCash" name="currentCash" value={inputs.currentCash} onChange={handleChange} className="mt-1" /></div>
        </div>

        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Forecast</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Net Cash Flow / Mo:</span><span className={`font-bold ${monthlyNet > 0 ? 'text-green-600' : 'text-red-500'}`}>{monthlyNet > 0 ? '+' : ''}${monthlyNet.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Annualized:</span><span className="text-foreground">${annualizedCashFlow.toLocaleString()}</span></div>
            <div className="flex justify-between pt-2 border-t border-border"><span className="text-muted-foreground">Cash Runway:</span><span className="font-medium text-foreground">{runwayMonths === Infinity ? '∞ (Positive)' : `${runwayMonths.toFixed(1)} months`}</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
