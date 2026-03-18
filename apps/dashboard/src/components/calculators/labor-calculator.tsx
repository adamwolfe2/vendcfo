"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";

export function LaborCalculator() {
  const [inputs, setInputs] = useState({
    hourlyWage: 18,
    hoursPerWeek: 40,
    benefitsPct: 25,
    routesServiced: 5,
    avgStopsPerRoute: 8,
  });

  const weeklyGross = inputs.hourlyWage * inputs.hoursPerWeek;
  const totalCostWeekly = weeklyGross * (1 + inputs.benefitsPct / 100);
  const monthlyCost = totalCostWeekly * 4.33;
  const costPerRoute = inputs.routesServiced > 0 ? monthlyCost / inputs.routesServiced : 0;
  const costPerStop = (inputs.routesServiced * inputs.avgStopsPerRoute) > 0
    ? monthlyCost / (inputs.routesServiced * inputs.avgStopsPerRoute)
    : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <CardTitle>Labor / Hiring Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hourlyWage">Hourly Wage ($)</Label>
              <Input type="number" id="hourlyWage" name="hourlyWage" value={inputs.hourlyWage} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="hoursPerWeek">Hours/Week</Label>
              <Input type="number" id="hoursPerWeek" name="hoursPerWeek" value={inputs.hoursPerWeek} onChange={handleChange} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="benefitsPct">Benefits Overhead (%)</Label>
            <Input type="number" id="benefitsPct" name="benefitsPct" value={inputs.benefitsPct} onChange={handleChange} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="routesServiced">Routes Serviced</Label>
              <Input type="number" id="routesServiced" name="routesServiced" value={inputs.routesServiced} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="avgStopsPerRoute">Avg Stops/Route</Label>
              <Input type="number" id="avgStopsPerRoute" name="avgStopsPerRoute" value={inputs.avgStopsPerRoute} onChange={handleChange} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Fully Loaded Cost</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Monthly Cost:</span><span className="font-bold text-foreground">${monthlyCost.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cost / Route:</span><span className="text-foreground">${costPerRoute.toFixed(2)}</span></div>
            <div className="flex justify-between pt-2 border-t border-border"><span className="text-muted-foreground">Cost / Stop:</span><span className="font-medium text-foreground">${costPerStop.toFixed(2)}</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
