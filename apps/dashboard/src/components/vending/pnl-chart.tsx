import React from 'react';

export function PnlChart() {
  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-100 mt-8 mb-8 h-80 flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-gray-900">12-Month Profit & Loss Trend</h3>
        <select className="text-sm border border-gray-200 rounded p-1 text-gray-600">
          <option>Last 12 Months</option>
          <option>Year to Date</option>
          <option>Last Quarter</option>
        </select>
      </div>
      
      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500 font-medium">Monthly P&L Line Chart rendering area...</p>
      </div>
    </div>
  );
}
