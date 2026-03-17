"use client";

import React, { useState } from 'react';
import { calculateMargin, MarginInputs, MarginOutputs } from '@vendcfo/calculators';

export function MarginCalculator() {
  const [inputs, setInputs] = useState<MarginInputs>({
    unitCost: 1.00,
    retailPrice: 2.00,
    merchantFeePct: 2.75,
    revSharePct: 15,
  });

  const results: MarginOutputs = calculateMargin(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev: MarginInputs) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Margin Calculator</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
          <input 
            type="number" 
            name="unitCost" 
            value={inputs.unitCost} 
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price ($)</label>
          <input 
            type="number" 
            name="retailPrice" 
            value={inputs.retailPrice} 
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Fee (%)</label>
            <input 
              type="number" 
              name="merchantFeePct" 
              value={inputs.merchantFeePct} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rev Share (%)</label>
            <input 
              type="number" 
              name="revSharePct" 
              value={inputs.revSharePct} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Results</h3>
        <div className="grid grid-cols-2 gap-y-3 font-mono text-sm">
          <div className="text-gray-500">Net Profit</div>
          <div className="text-right font-medium text-green-700">${results.netProfitPerUnit}</div>
          
          <div className="text-gray-500">Gross Margin</div>
          <div className={`text-right font-bold ${results.grossMarginPct < 30 ? 'text-red-500' : 'text-green-600'}`}>
            {results.grossMarginPct}%
          </div>
          
          <div className="text-gray-500">Break Even</div>
          <div className="text-right text-gray-900">${results.breakEvenPrice}</div>
        </div>
        
        {results.grossMarginPct < 30 && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
            Warning: Margin is below 30%. Consider raising price to ${results.suggestedPrices.margin35} to reach 35% margin.
          </div>
        )}
      </div>
    </div>
  );
}
