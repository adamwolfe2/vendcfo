import React, { useState } from 'react';
import { calculateEquipmentFinancing, EquipmentFinancingInputs, EquipmentFinancingOutputs } from '@vendcfo/calculators';

export function EquipmentFinancingCalculator() {
  const [inputs, setInputs] = useState<EquipmentFinancingInputs>({
    equipmentPrice: 4500,
    downPayment: 500,
    apr: 6.5,
    termMonths: 36,
    expectedMonthlyGrossRevenue: 600,
    expectedMonthlyCogs: 300,
    expectedRevSharePct: 10,
    expectedMonthlyServicingCost: 40,
  });

  const results: EquipmentFinancingOutputs = calculateEquipmentFinancing(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev: EquipmentFinancingInputs) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Equipment Financing ROI</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Loan Details</h3>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Equipment Price ($)</label>
              <input type="number" name="equipmentPrice" value={inputs.equipmentPrice} onChange={handleChange} className="w-full border p-2 rounded-md sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Down Payment ($)</label>
              <input type="number" name="downPayment" value={inputs.downPayment} onChange={handleChange} className="w-full border p-2 rounded-md sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">APR (%)</label>
              <input type="number" name="apr" value={inputs.apr} onChange={handleChange} className="w-full border p-2 rounded-md sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Term (Months)</label>
              <input type="number" name="termMonths" value={inputs.termMonths} onChange={handleChange} className="w-full border p-2 rounded-md sm:text-sm" />
            </div>
          </div>

          <h3 className="font-semibold text-gray-700 border-b pb-2 mt-6">Route Assumptions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expected Revenue ($)</label>
              <input type="number" name="expectedMonthlyGrossRevenue" value={inputs.expectedMonthlyGrossRevenue} onChange={handleChange} className="w-full border p-2 rounded-md sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Expected COGS ($)</label>
              <input type="number" name="expectedMonthlyCogs" value={inputs.expectedMonthlyCogs} onChange={handleChange} className="w-full border p-2 rounded-md sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rev Share (%)</label>
              <input type="number" name="expectedRevSharePct" value={inputs.expectedRevSharePct} onChange={handleChange} className="w-full border p-2 rounded-md sm:text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Servicing Cost ($)</label>
              <input type="number" name="expectedMonthlyServicingCost" value={inputs.expectedMonthlyServicingCost} onChange={handleChange} className="w-full border p-2 rounded-md sm:text-sm" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col justify-center">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Monthly Payment</p>
            <h3 className="text-4xl font-black text-gray-900 mt-2">${results.monthlyPayment}</h3>
          </div>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Payback Period</span>
              <span className={`font-bold ${results.monthsToPayback > 24 ? 'text-red-500' : 'text-green-600'}`}>{results.monthsToPayback} months</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Cash Flow Impact</span>
              <span className={results.cashOnCashMonthlyImpact > 0 ? 'text-green-600' : 'text-red-500'}>
                {results.cashOnCashMonthlyImpact > 0 ? '+' : ''}${results.cashOnCashMonthlyImpact}/mo
              </span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-gray-500">Total Interest</span>
              <span className="text-gray-900">${results.totalInterestPaid}</span>
            </div>
          </div>
          
          {results.monthsToPayback > 24 && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 text-xs rounded-md">
              <strong>High Risk:</strong> Payback window exceeds 24 months. Consider negotiating down payment, lowering APR, or finding a higher volume location.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
