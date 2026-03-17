import React from 'react';
import { Server } from 'lucide-react';
import { getDb } from '@vendcfo/spreadsheet-bridge';

export default function MachinesPage() {
  const db = getDb();
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment & Machines</h1>
          <p className="text-gray-600">Track machine inventory, financing obligations, and service history.</p>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition">
          Add Machine
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial / Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Last Serviced</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Financing Payment</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {db.machines.map((mac) => (
              <tr key={mac.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Server className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{mac.serial}</div>
                      <div className="text-xs text-gray-500">{mac.model}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{db.locations.find(l => l.id === mac.locationId)?.name || 'Needs Location'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{mac.lastService}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 font-mono">{mac.payment}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${mac.status === 'Online' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {mac.status}
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
