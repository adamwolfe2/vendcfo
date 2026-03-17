"use client";

import React, { useState } from 'react';
import { calculateEquipmentFinancing, EquipmentFinancingInputs, EquipmentFinancingOutputs } from '@vendcfo/calculators';

export function EquipmentFinancingCalculator() {
  const [inputs, setInputs] = useState<EquipmentFinancingInputs>({
    equipmentPrice: 4500,
    downPayment: 500,
    apr: 8.5,
    termMonths: 36,
    expectedMonthlyGrossRevenue: 600,
    expectedMonthlyCogs: 240,
    expectedRevSharePct: 10,
    expectedMonthlyServicingCost: 75
  });

  const results: EquipmentFinancingOutputs = calculateEquipmentFinancing(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Equipment ROI & Financing</h2>
      <p className="text-sm text-gray-500 mb-6">Determine if a new machine purchase pencils out when factoring in debt service.</p>
      
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Machine Price ($)</label>
            <input 
              type="number" 
              name="equipmentPrice" 
              value={inputs.equipmentPrice} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment ($)</label>
            <input 
              type="number" 
              name="downPayment" 
              value={inputs.downPayment} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan APR (%)</label>
            <input 
              type="number" 
              name="apr" 
              value={inputs.apr} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term (Months)</label>
            <input 
              type="number" 
              name="termMonths" 
              value={inputs.termMonths} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Rev / Mo</label>
              <input 
                type="number" 
                name="expectedMonthlyGrossRevenue" 
                value={inputs.expectedMonthlyGrossRevenue} 
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est COGS / Mo</label>
              <input 
                type="number" 
                name="expectedMonthlyCogs" 
                value={inputs.expectedMonthlyCogs} 
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
              />
            </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Investment Analysis</h3>
        
        <div className="space-y-3 font-mono text-sm max-w-full overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Monthly Debt Payment:</span>
            <span className="font-medium text-red-600">
              ${results.monthlyPayment.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Net Cash Flow Impact / Mo:</span>
            <span className={`font-bold ${results.cashOnCashMonthlyImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {results.cashOnCashMonthlyImpact > 0 ? '+' : ''}${results.cashOnCashMonthlyImpact.toLocaleString()}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200 mt-2 flex justify-between items-center">
            <span className="text-gray-500">Months to ROI Payback:</span>
            <span className="font-medium text-gray-900">
              {results.monthsToPayback === Infinity ? 'Never' : `${results.monthsToPayback.toFixed(1)} months`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
