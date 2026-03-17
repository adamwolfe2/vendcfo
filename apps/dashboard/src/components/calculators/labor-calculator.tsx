"use client";

import React, { useState } from 'react';
import { calculateLabor, LaborInputs, LaborOutputs } from '@vendcfo/calculators';

export function LaborCalculator() {
  const [inputs, setInputs] = useState<LaborInputs>({
    hourlyWage: 20,
    hoursPerWeek: 40,
    payrollBurdenPct: 15,
    expectedRouteRevenueIncrease: 3000,
    serviceTimeSavedHours: 15,
    numberOfStopsToAdd: 5
  });

  const results: LaborOutputs = calculateLabor(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev: LaborInputs) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Labor Break-Even</h2>
      <p className="text-sm text-gray-500 mb-6">Model the true cost of hiring a new picker or route driver and map it to required revenue.</p>
      
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Wage ($)</label>
            <input 
              type="number" 
              name="hourlyWage" 
              value={inputs.hourlyWage} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours / Week</label>
            <input 
              type="number" 
              name="hoursPerWeek" 
              value={inputs.hoursPerWeek} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payroll Burden (%)</label>
          <div className="text-xs text-gray-400 mb-1">Includes taxes, workers comp, insurance.</div>
          <input 
            type="number" 
            name="payrollBurdenPct" 
            value={inputs.payrollBurdenPct} 
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
          />
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Monthly Rev. Increase ($)</label>
          <input 
            type="number" 
            name="expectedRouteRevenueIncrease" 
            value={inputs.expectedRouteRevenueIncrease} 
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
          />
        </div>

      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Cost Analysis</h3>
        <div className="grid grid-cols-2 gap-y-3 font-mono text-sm max-w-full overflow-hidden">
          <div className="text-gray-500">Fully Loaded Weekly</div>
          <div className="text-right font-medium text-gray-800">${results.fullyLoadedWeeklyCost.toFixed(2)} / wk</div>
          
          <div className="text-gray-500">Monthly Payroll Cost</div>
          <div className="text-right font-bold text-red-600">
            ${results.fullyLoadedMonthlyCost.toLocaleString()}
          </div>
          
          <div className="text-gray-500">Impact on Profit</div>
          <div className={`text-right font-medium ${results.incrementalMonthlyProfitImpact > 0 ? "text-green-600" : "text-red-500"}`}>
            ${results.incrementalMonthlyProfitImpact.toLocaleString()} / mo
          </div>
        </div>
        
        {results.incrementalMonthlyProfitImpact < 0 ? (
          <div className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>Warning:</strong> The expected revenue increase does not cover the fully loaded cost at a standard 50% margin. 
          </div>
        ) : (
          <div className="mt-4 text-xs text-green-700 bg-green-50 p-2 rounded">
            <strong>Viable:</strong> Expected revenue covers the cost of this employee, generating an estimated additional net profit.
          </div>
        )}
      </div>
    </div>
  );
}
