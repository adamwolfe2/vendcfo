import React from 'react';
import { Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getDb } from '@vendcfo/spreadsheet-bridge';

export default function LocationsPage() {
  const db = getDb();
  const sortedLocations = [...db.locations].sort((a, b) => b.profit - a.profit);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600">Manage location agreements, revenue share, and profitability.</p>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition">
          Add Location
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Machines</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rev Share %</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">30d Net Profit</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLocations.map((loc) => (
              <tr key={loc.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Building2 className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                    <div className="text-sm font-medium text-gray-900">{loc.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{db.routes.find(r => r.id === loc.routeId)?.name || 'Needs Route'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{loc.machines}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{loc.revShare}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {loc.profit > 0 ? (
                    <span className="text-green-600 flex justify-end items-center"><ArrowUpRight size={14} className="mr-1"/>${loc.profit}</span>
                  ) : (
                    <span className="text-red-500 flex justify-end items-center"><ArrowDownRight size={14} className="mr-1"/>-${Math.abs(loc.profit)}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loc.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {loc.status}
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
