import { Card, CardContent } from "@vendcfo/ui/card";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alerts | VendCFO',
  description: 'AI insights, profit leaks, and operational warnings.',
};

const alerts = [
  {
    severity: 'CRITICAL' as const,
    title: 'Cash Flow Warning',
    message: 'Cash is projected to drop below your 2-month threshold in 14 days.',
    colors: 'border-l-red-500 dark:border-l-red-400',
    badge: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  {
    severity: 'WARNING' as const,
    title: 'Low Margin Alert',
    message: 'Location #4 margin dropped by 18% month-over-month. Review COGS.',
    colors: 'border-l-yellow-500 dark:border-l-yellow-400',
    badge: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  },
  {
    severity: 'INFO' as const,
    title: 'Seasonal Trend Detected',
    message: 'Revenue at University Campus locations typically increases 22% in September. Consider pre-stocking.',
    colors: 'border-l-blue-500 dark:border-l-blue-400',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
];

export default function AlertsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Alerts Center</h1>
        <p className="text-muted-foreground">AI insights, profit leaks, and operational warnings.</p>
      </div>
      
      <div className="space-y-4">
        {alerts.map((alert, i) => (
          <Card key={i} className={`border-l-4 ${alert.colors}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${alert.badge}`}>
                  {alert.severity}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
