"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@vendcfo/ui/card";
import { Input } from "@vendcfo/ui/input";
import { Label } from "@vendcfo/ui/label";

interface ProductRow { name: string; unitsSold: number; margin: number; }

export function ProductMixCalculator() {
  const [products, setProducts] = useState<ProductRow[]>([
    { name: 'Snickers', unitsSold: 120, margin: 45 },
    { name: 'Doritos', unitsSold: 80, margin: 38 },
    { name: 'Red Bull', unitsSold: 60, margin: 52 },
  ]);

  const totalUnits = products.reduce((s, p) => s + p.unitsSold, 0);
  const weightedMargin = totalUnits > 0 ? products.reduce((s, p) => s + (p.unitsSold / totalUnits) * p.margin, 0) : 0;

  const handleChange = (idx: number, field: keyof ProductRow, value: string) => {
    setProducts((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: field === 'name' ? value : (parseFloat(value) || 0) } : p));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4"><CardTitle>Product Mix Analyzer</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3 mb-6">
          {products.map((p, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <div><Label>Name</Label><Input value={p.name} onChange={(e) => handleChange(i, 'name', e.target.value)} className="mt-1" /></div>
              <div><Label>Units</Label><Input type="number" value={p.unitsSold} onChange={(e) => handleChange(i, 'unitsSold', e.target.value)} className="mt-1" /></div>
              <div><Label>Margin %</Label><Input type="number" value={p.margin} onChange={(e) => handleChange(i, 'margin', e.target.value)} className="mt-1" /></div>
            </div>
          ))}
          <button onClick={() => setProducts([...products, { name: '', unitsSold: 0, margin: 0 }])} className="text-sm text-primary hover:text-primary/80 font-medium">+ Add Product</button>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Blended Analysis</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Units:</span><span className="text-foreground">{totalUnits}</span></div>
            <div className="flex justify-between pt-2 border-t border-border"><span className="text-muted-foreground">Weighted Margin:</span><span className={`font-bold ${weightedMargin < 35 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{weightedMargin.toFixed(1)}%</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
