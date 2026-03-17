"use client";

import React, { useState } from 'react';
import { calculateMarkup, MarkupInputs, MarkupOutputs } from '@vendcfo/calculators';
import { Tag, TrendingUp } from 'lucide-react';

export function MarkupCalculator() {
  const [inputs, setInputs] = useState<MarkupInputs>({
    costPerUnit: 0.85,
    targetMarginPct: 50,
    locationType: 'office',
    expectedMonthlyVolume: 120
  });

  const results: MarkupOutputs = calculateMarkup(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs((prev: MarkupInputs) => ({ 
      ...prev, 
      [name]: name === 'locationType' ? value : (parseFloat(value) || 0) 
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-md">
      <div className="flex items-center mb-4">
        <Tag className="text-gray-400 mr-2" size={24} />
        <h2 className="text-xl font-bold">Target Markup</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">Calculate optimal vending price rounded to the nearest quarter based on your desired margin.</p>
      
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
            <input 
              type="number" 
              step="0.05"
              name="costPerUnit" 
              value={inputs.costPerUnit} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Margin (%)</label>
            <input 
              type="number" 
              name="targetMarginPct" 
              value={inputs.targetMarginPct} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Monthly Sales (Units)</label>
          <input 
            type="number" 
            name="expectedMonthlyVolume" 
            value={inputs.expectedMonthlyVolume} 
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border" 
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Pricing Recommendation</h3>
        
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Retail Price</p>
            <p className="text-3xl font-black text-primary">${results.recommendedRetailPrice.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Est. Monthly Profit</p>
            <p className="text-xl font-bold text-green-600">${results.projectedMonthlyProfit.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Profit Sensitivity</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded border border-gray-100 flex justify-between">
              <span className="text-gray-500">- $0.25</span>
              <span className="font-medium text-red-500">${results.sensitivityTable.minus25Cents}/mo</span>
            </div>
            <div className="bg-white p-2 rounded border border-gray-100 flex justify-between">
              <span className="text-gray-500">+ $0.25</span>
              <span className="font-medium text-green-600">${results.sensitivityTable.plus25Cents}/mo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
