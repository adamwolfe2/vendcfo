import { DollarSign, TrendingUp, Percent, Wallet } from "lucide-react";
import { getDb, calculateDashboardMetrics } from '@vendcfo/spreadsheet-bridge';

export function KpiCards() {
  const db = getDb();
  let metrics = { revenue: 12450.00, profit: 4850.50, margin: 38.9, cash: 28000.00 };
  
  if (db.transactions && db.transactions.length > 0) {
    metrics = calculateDashboardMetrics(db);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">${metrics.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign size={20} />
          </div>
        </div>
        <p className="text-sm text-green-600 font-medium flex items-center">
          <TrendingUp size={14} className="mr-1" /> +12% from last month
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Net Profit</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">${metrics.profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
          </div>
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp size={20} />
          </div>
        </div>
        <p className="text-sm text-green-600 font-medium flex items-center">
          <TrendingUp size={14} className="mr-1" /> +5% from last month
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Gross Margin</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.margin.toFixed(1)}%</h3>
          </div>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Percent size={20} />
          </div>
        </div>
        <p className="text-sm text-red-500 font-medium flex items-center">
          <TrendingUp size={14} className="mr-1 transform rotate-180" /> -1.2% from last month
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Cash on Hand</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">${metrics.cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
          </div>
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
            <Wallet size={20} />
          </div>
        </div>
        <p className="text-sm text-gray-500 font-medium flex items-center">
          Provides 4.5 months runway
        </p>
      </div>
    </div>
  );
}
