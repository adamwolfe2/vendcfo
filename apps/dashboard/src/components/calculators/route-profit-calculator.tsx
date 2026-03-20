"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";
import type React from "react";
import { useState } from "react";

export function RouteProfitCalculator() {
  const [inputs, setInputs] = useState({
    stops: 10,
    avgRevenuePerStop: 200,
    avgCostPerStop: 80,
    driverCostPerRoute: 150,
    vehicleCostPerRoute: 50,
    revSharePct: 10,
  });

  const grossRevenue = inputs.stops * inputs.avgRevenuePerStop;
  const totalCOGS = inputs.stops * inputs.avgCostPerStop;
  const revShareCost = grossRevenue * (inputs.revSharePct / 100);
  const netProfit =
    grossRevenue -
    totalCOGS -
    revShareCost -
    inputs.driverCostPerRoute -
    inputs.vehicleCostPerRoute;
  const profitPerStop = inputs.stops > 0 ? netProfit / inputs.stops : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle>Route Profitability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stops">Stops per Route</Label>
              <Input
                type="number"
                id="stops"
                name="stops"
                value={inputs.stops}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="avgRevenuePerStop">Avg Rev / Stop</Label>
              <Input
                type="number"
                id="avgRevenuePerStop"
                name="avgRevenuePerStop"
                value={inputs.avgRevenuePerStop}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="avgCostPerStop">Avg COGS / Stop</Label>
              <Input
                type="number"
                id="avgCostPerStop"
                name="avgCostPerStop"
                value={inputs.avgCostPerStop}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="revSharePct">Rev Share (%)</Label>
              <Input
                type="number"
                id="revSharePct"
                name="revSharePct"
                value={inputs.revSharePct}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="driverCostPerRoute">Driver Cost</Label>
              <Input
                type="number"
                id="driverCostPerRoute"
                name="driverCostPerRoute"
                value={inputs.driverCostPerRoute}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="vehicleCostPerRoute">Vehicle Cost</Label>
              <Input
                type="number"
                id="vehicleCostPerRoute"
                name="vehicleCostPerRoute"
                value={inputs.vehicleCostPerRoute}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
            Route P&L
          </h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross Revenue:</span>
              <span className="text-foreground">
                ${grossRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Net Profit:</span>
              <span
                className={`font-bold ${netProfit > 0 ? "text-green-600" : "text-red-500"}`}
              >
                {netProfit > 0 ? "+" : ""}${netProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Profit / Stop:</span>
              <span className="font-medium text-foreground">
                ${profitPerStop.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
