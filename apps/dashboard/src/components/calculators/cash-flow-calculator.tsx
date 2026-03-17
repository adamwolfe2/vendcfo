import React, { useState } from 'react';
import { calculateCashFlow, CashFlowInputs, CashFlowOutputs } from '@vendcfo/calculators';

export function CashFlowCalculator() {
  const [inputs, setInputs] = useState<CashFlowInputs>({
    currentCashBalance: 25000,
    recurringFixedExpensesMonthly: 3000,
    variableExpensesAvgPct: 40,
    debtPaymentsMonthly: 1200,
    projectedMonthlySales: 15000,
    seasonalityAdjustmentPct: 0
  });

  const results: CashFlowOutputs = calculateCashFlow(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev: CashFlowInputs) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Cash Flow Forecast</h2>
      <p className="text-sm text-gray-500 mb-6">Project your 30, 60, and 90-day cash position and calculate your safe spend threshold for new machine purchases.</p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Cash Balance ($)</label>
          <input 
            type="number" 
            name="currentCashBalance" 
            value={inputs.currentCashBalance} 
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Expenses / Mo</label>
            <input 
              type="number" 
              name="recurringFixedExpensesMonthly" 
              value={inputs.recurringFixedExpensesMonthly} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debt Payments / Mo</label>
            <input 
              type="number" 
              name="debtPaymentsMonthly" 
              value={inputs.debtPaymentsMonthly} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Projected Dev / Mo</label>
            <input 
              type="number" 
              name="projectedMonthlySales" 
              value={inputs.projectedMonthlySales} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variable Cost %</label>
            <input 
              type="number" 
              name="variableExpensesAvgPct" 
              value={inputs.variableExpensesAvgPct} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Forecast</h3>
        
        <div className="grid grid-cols-3 text-center mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">30 Days</div>
            <div className={`font-medium ${results.projectedBalance30Days < 0 ? 'text-red-600' : 'text-gray-900'}`}>${results.projectedBalance30Days.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">60 Days</div>
            <div className={`font-medium ${results.projectedBalance60Days < 0 ? 'text-red-600' : 'text-gray-900'}`}>${results.projectedBalance60Days.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">90 Days</div>
            <div className={`font-medium ${results.projectedBalance90Days < 0 ? 'text-red-600' : 'text-gray-900'}`}>${results.projectedBalance90Days.toLocaleString()}</div>
          </div>
        </div>

        <div className="space-y-2 font-mono text-sm max-w-full overflow-hidden border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Monthly Burn Rate:</span>
            <span className={results.burnRate > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
              ${results.burnRate.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Runway:</span>
            <span className="font-medium">{results.runwayMonths === Infinity ? '> 12 months' : `${results.runwayMonths} months`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Safe Spend Ammo:</span>
            <span className="text-blue-600 font-bold">${results.safeSpendThreshold.toLocaleString()}</span>
          </div>
        </div>
        
        {results.isRunwayCritical && (
          <div className="mt-4 text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>CRITICAL:</strong> Business indicates less than 1 month of runway based on current burn rate. Immediate cash infusion or cost reduction required.
          </div>
        )}
      </div>
    </div>
  );
}
