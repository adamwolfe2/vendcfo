"use client";

import React, { useState } from 'react';
import { calculateBreakEven, BreakEvenInputs, BreakEvenOutputs } from '@vendcfo/calculators';

export function BreakEvenCalculator() {
  const [inputs, setInputs] = useState<BreakEvenInputs>({
    fixedMonthlyCostsGlobal: 5000,
    avgGrossMarginPct: 45,
    perLocationFixedCostsAvg: 100,
    monthlyDebtObligations: 1200
  });

  const results: BreakEvenOutputs = calculateBreakEven(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Break-Even Analysis</h2>
      <p className="text-sm text-gray-500 mb-6">Calculate exactly how much revenue and how many locations you need to cover all fixed costs.</p>
      
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Global Fixed Costs ($)</label>
            <input 
              type="number" 
              name="fixedMonthlyCostsGlobal" 
              value={inputs.fixedMonthlyCostsGlobal} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avg Gross Margin (%)</label>
            <input 
              type="number" 
              name="avgGrossMarginPct" 
              value={inputs.avgGrossMarginPct} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Cost / Location</label>
            <input 
              type="number" 
              name="perLocationFixedCostsAvg" 
              value={inputs.perLocationFixedCostsAvg} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Debt ($)</label>
            <input 
              type="number" 
              name="monthlyDebtObligations" 
              value={inputs.monthlyDebtObligations} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Break-Even Target</h3>
        
        <div className="space-y-3 font-mono text-sm max-w-full overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Revenue Required / Mo:</span>
            <span className="font-bold text-blue-600">
              ${results.totalRevenueRequired.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-gray-500">Locations Required:</span>
            <span className="font-medium text-gray-900">
              {results.locationsRequiredToBreakEven === Infinity 
                ? 'Unreachable' 
                : Math.ceil(results.locationsRequiredToBreakEven).toLocaleString()} Machines
            </span>
          </div>
        </div>
        
        {results.locationsRequiredToBreakEven === Infinity && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>Warning:</strong> Your locations are currently losing money on a unit basis. You cannot break even by adding more locations unless margins improve.
          </div>
        )}
      </div>
    </div>
  );
}
