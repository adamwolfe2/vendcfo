import React from 'react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

const MOCK_ROUTES = [
  { id: '1', name: 'Downtown Core', stops: 12, revenue: 8400, profit: 3200, profitPerVisit: 133, status: 'green' },
  { id: '2', name: 'Westside Gym & Transit', stops: 8, revenue: 5100, profit: 1600, profitPerVisit: 100, status: 'yellow' },
  { id: '3', name: 'University Campus', stops: 15, revenue: 9800, profit: 4100, profitPerVisit: 136, status: 'green' },
  { id: '4', name: 'Industrial Park South', stops: 6, revenue: 1200, profit: -150, profitPerVisit: -12, status: 'red' },
];

export function RouteTable() {
  return (
    <div className="bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Route Profitability Ranking</h3>
        <button className="text-sm text-blue-600 font-medium hover:text-blue-800">Export CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locations</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Rev/mo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit/mo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Visit</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {MOCK_ROUTES.sort((a, b) => b.profit - a.profit).map((route) => (
              <tr key={route.id} className="hover:bg-gray-50 cursor-pointer transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{route.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.stops}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">${route.revenue.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {route.profit > 0 ? (
                    <span className="text-green-600 flex items-center justify-end"><ArrowUpRight size={14} className="mr-1"/>${route.profit.toLocaleString()}</span>
                  ) : (
                    <span className="text-red-500 flex items-center justify-end"><ArrowDownRight size={14} className="mr-1"/>-${Math.abs(route.profit).toLocaleString()}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">${route.profitPerVisit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    route.status === 'green' ? 'bg-green-100 text-green-800' :
                    route.status === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {route.status === 'red' && <AlertTriangle size={12} className="mr-1" />}
                    {route.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
