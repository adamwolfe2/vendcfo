"use client";

import React, { useState } from 'react';
import { calculateRevShare, RevShareInputs, RevShareOutputs } from '@vendcfo/calculators';

export function RevShareCalculator() {
  const [inputs, setInputs] = useState<RevShareInputs>({
    grossSales: 1000,
    revShareType: 'flat',
    commissionPct: 10,
    thresholdAmount: 500
  });

  const results: RevShareOutputs = calculateRevShare(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ 
      ...prev, 
      [name]: name === 'revShareType' ? value : (parseFloat(value) || 0) 
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Revenue Share Calculator</h2>
      <p className="text-sm text-gray-500 mb-6">Determine location commission payouts and effective margin impact.</p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Gross Sales ($)</label>
          <input 
            type="number" 
            name="grossSales" 
            value={inputs.grossSales} 
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
            <select 
              name="revShareType" 
              value={inputs.revShareType} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border bg-white"
            >
              <option value="flat">Flat %</option>
              <option value="tiered">Tiered (Above $)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
            <input 
              type="number" 
              name="commissionPct" 
              value={inputs.commissionPct} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>

        {inputs.revShareType === 'tiered' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Threshold Amount ($)</label>
            <input 
              type="number" 
              name="thresholdAmount" 
              value={inputs.thresholdAmount} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
            <p className="text-xs text-gray-500 mt-1">Commission applies only to sales above this amount.</p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Payout & Impact</h3>
        
        <div className="space-y-3 font-mono text-sm max-w-full overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Total Payout to Location:</span>
            <span className="font-bold text-red-600">
              ${results.totalPayoutToLocation.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Net Revenue Retained:</span>
            <span className="font-medium text-green-600">
              ${results.netRevenueRetainedByOperator.toLocaleString()}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200 mt-2 flex justify-between items-center">
            <span className="text-gray-500">Margin Exhaustion Risk:</span>
            <span className={`font-medium ${results.revShareAsPctOfGrossMargin > 30 ? 'text-red-600' : 'text-gray-900'}`}>
              {results.revShareAsPctOfGrossMargin.toFixed(1)}% of Gross Profit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
