import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";

export function PnlChart() {
  return (
    <Card className="mt-4 mb-8">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">12-Month Profit &amp; Loss Trend</CardTitle>
        <select className="text-sm border border-border rounded-md px-2 py-1 text-muted-foreground bg-background">
          <option>Last 12 Months</option>
          <option>Year to Date</option>
          <option>Last Quarter</option>
        </select>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-secondary/50">
          <p className="text-muted-foreground font-medium">Monthly P&amp;L Line Chart rendering area...</p>
        </div>
      </CardContent>
    </Card>
  );
}
