import { Bell } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alerts | VendCFO',
  description: 'AI insights, profit leaks, and operational warnings.',
};

export default function AlertsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Alerts Center</h1>
        <p className="text-muted-foreground">AI insights, profit leaks, and operational warnings.</p>
      </div>

      <div className="border border-dashed border-[#ddd] rounded-lg p-12 text-center">
        <Bell className="mx-auto mb-4 text-[#ccc]" size={40} />
        <p className="text-sm font-medium text-[#555]">No alerts yet</p>
        <p className="text-xs text-[#999] mt-1">
          Alerts will appear here when unusual activity is detected in your operations.
        </p>
      </div>
    </div>
  );
}
