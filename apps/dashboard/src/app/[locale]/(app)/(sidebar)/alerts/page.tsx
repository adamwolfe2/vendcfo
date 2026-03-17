export default function AlertsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Alerts Center</h1>
      <p className="text-gray-600 mb-8">AI insights, profit leaks, and operational warnings.</p>
      
      <div className="space-y-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500 font-bold">CRITICAL</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Cash Flow Warning</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Cash is projected to drop below your 2-month threshold in 14 days.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-600 font-bold">WARNING</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Low Margin Alert</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Location #4 margin dropped by 18% month-over-month. Review COGS.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
