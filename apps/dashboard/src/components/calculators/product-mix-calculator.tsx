"use client";

import React, { useState } from 'react';
import { calculateProductMix, ProductMixInputs } from '@vendcfo/calculators';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';

export function ProductMixCalculator() {
  const [inputs, setInputs] = useState<ProductMixInputs>({
    skus: [
      { id: 'Snickers', unitCost: 0.65, retailPrice: 1.50, unitsSoldPerMonth: 45, spoilagePct: 2, slotsOccupied: 1, refillFrequency: 4 },
      { id: 'Generic Granola', unitCost: 0.50, retailPrice: 1.25, unitsSoldPerMonth: 12, spoilagePct: 15, slotsOccupied: 1, refillFrequency: 4 }
    ]
  });

  const results = calculateProductMix(inputs).skuResults;

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => {
      const newSkus = [...prev.skus];
      const target = newSkus[index];
      if (target) {
        newSkus[index] = {
           ...target,
           [name]: name === 'id' ? value : (parseFloat(value) || 0)
        } as any;
      }
      return { skus: newSkus };
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-2xl flex flex-col h-full">
      <div className="flex items-center mb-4">
        <Package className="text-gray-400 mr-2" size={24} />
        <h2 className="text-xl font-bold">Product Mix Analyzer</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">Compare SKUs side-by-side to identify slotting inefficiencies and spoilage impacts.</p>
      
      <div className="grid grid-cols-2 gap-6 flex-1">
        {inputs.skus.map((sku, idx) => {
          const result = results[idx];
          if (!result) return null;

          return (
            <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col justify-between">
              <div>
                <input 
                  type="text" 
                  name="id" 
                  value={sku.id} 
                  onChange={(e) => handleChange(idx, e)}
                  className="w-full bg-transparent border-b border-gray-300 font-bold text-lg mb-4 pb-1 focus:outline-none focus:border-primary" 
                  placeholder="SKU Name"
                />
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">Unit Cost ($)</label>
                      <input type="number" step="0.05" name="unitCost" value={sku.unitCost} onChange={(e) => handleChange(idx, e)} className="w-full text-sm p-1 border rounded" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Retail Price ($)</label>
                      <input type="number" step="0.25" name="retailPrice" value={sku.retailPrice} onChange={(e) => handleChange(idx, e)} className="w-full text-sm p-1 border rounded" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">Monthly Sold</label>
                      <input type="number" name="unitsSoldPerMonth" value={sku.unitsSoldPerMonth} onChange={(e) => handleChange(idx, e)} className="w-full text-sm p-1 border rounded" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Spoilage (%)</label>
                      <input type="number" name="spoilagePct" value={sku.spoilagePct} onChange={(e) => handleChange(idx, e)} className="w-full text-sm p-1 border rounded" />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-6 p-3 rounded-md border ${result.isLowPerforming ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase font-bold text-gray-500">Gross Margin</span>
                  <span className={`font-bold ${result.isLowPerforming ? 'text-red-600' : 'text-green-600'}`}>
                    {result.grossMarginPct}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold text-gray-500">Mo. Profit</span>
                  <span className="font-bold text-gray-900">
                    ${result.grossProfitDollars.toFixed(2)}
                  </span>
                </div>
                {result.isLowPerforming ? (
                  <div className="mt-3 flex items-start text-xs text-red-600">
                    <AlertCircle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                    Warning: Under 25% margin. Consider replacing.
                  </div>
                ) : (
                  <div className="mt-3 flex items-start text-xs text-green-700">
                    <CheckCircle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                    Healthy Margin. Retain in mix.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
