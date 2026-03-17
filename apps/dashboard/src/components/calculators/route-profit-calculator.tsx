import React, { useState } from 'react';
import { calculateRouteProfit, RouteProfitInputs, RouteProfitOutputs } from '@vendcfo/calculators';

export function RouteProfitCalculator() {
  const [inputs, setInputs] = useState<RouteProfitInputs>({
    locationGrossRevenue: 1500,
    productMixCogs: 600,
    laborTimeHoursPerVisit: 0.5,
    travelTimeHoursPerVisit: 0.5,
    revSharePct: 15,
    serviceFrequencyVisitsPerMonth: 4,
    machineFinancingMonthlyCost: 150
  });

  const results: RouteProfitOutputs = calculateRouteProfit(inputs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev: RouteProfitInputs) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Route Profitability</h2>
      <p className="text-sm text-gray-500 mb-6">Analyze the true profit of a specific location factoring in drive time, COGS, and labor.</p>
      
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gross Rev / Mo ($)</label>
            <input 
              type="number" 
              name="locationGrossRevenue" 
              value={inputs.locationGrossRevenue} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total COGS / Mo ($)</label>
            <input 
              type="number" 
              name="productMixCogs" 
              value={inputs.productMixCogs} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visits / Month</label>
            <input 
              type="number" 
              name="serviceFrequencyVisitsPerMonth" 
              value={inputs.serviceFrequencyVisitsPerMonth} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Cost / Mo ($)</label>
            <input 
              type="number" 
              name="machineFinancingMonthlyCost" 
              value={inputs.machineFinancingMonthlyCost} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service (hrs)</label>
            <input 
              type="number" 
              name="laborTimeHoursPerVisit" 
              value={inputs.laborTimeHoursPerVisit} 
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drive (hrs)</label>
            <input 
              type="number" 
              name="travelTimeHoursPerVisit" 
              value={inputs.travelTimeHoursPerVisit} 
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
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Profit Analysis</h3>
        
        <div className="space-y-3 font-mono text-sm max-w-full overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Net Profit (Monthly):</span>
            <span className={`font-bold ${results.netProfitPerLocation > 0 ? 'text-green-600' : 'text-red-500'}`}>
              ${results.netProfitPerLocation.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Value of a Visit:</span>
            <span className="font-medium text-gray-900">
              ${results.profitPerVisit.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Value of Labor Hour:</span>
            <span className="font-medium text-gray-900">
              ${results.profitPerLaborHour.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
            {results.efficiencyStatus === 'green' && (
              <div className="text-xs text-green-700 bg-green-50 p-2 rounded flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> Excellent route efficiency.
              </div>
            )}
            {results.efficiencyStatus === 'yellow' && (
              <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div> Acceptable efficiency. Check drive times.
              </div>
            )}
             {results.efficiencyStatus === 'red' && (
              <div className="text-xs text-red-700 bg-red-50 p-2 rounded flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div> Poor efficiency. Route is losing profitability.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
