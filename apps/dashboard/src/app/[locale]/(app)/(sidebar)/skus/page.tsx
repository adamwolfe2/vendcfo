import React from 'react';
import { PackageOpen } from 'lucide-react';
import { getDb } from '@vendcfo/spreadsheet-bridge';

export default function SkusPage() {
  const db = getDb();
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products & SKUs</h1>
          <p className="text-gray-600">Analyze product margins, identify low performers, and adjust pricing.</p>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-800 transition">
          Add Product
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Retail Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Gross Margin %</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Velocity</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {db.skus.map((sku) => (
              <tr key={sku.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <PackageOpen className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sku.name}</div>
                      <div className="text-xs text-gray-500">{sku.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-mono">${sku.cost.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-mono">${sku.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <span className={`mr-2 font-medium ${sku.margin < 30 ? 'text-red-500' : 'text-green-600'}`}>{sku.margin}%</span>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${sku.margin < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(sku.margin, 100)}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sku.velocity === 'High' ? 'bg-blue-100 text-blue-800' : 
                    sku.velocity === 'Medium' ? 'bg-gray-100 text-gray-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {sku.velocity}
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
