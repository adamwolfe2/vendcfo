"use client";

import { AlertTriangle, UserPlus, Users } from "lucide-react";

interface CapacityAlert {
  employeeName: string;
  alertType: "approaching" | "at_capacity" | "over_capacity";
  utilization: number;
  message: string;
}

const ALERT_STYLES: Record<
  CapacityAlert["alertType"],
  { border: string; bg: string; icon: string; badge: string; label: string }
> = {
  approaching: {
    border: "border-yellow-300",
    bg: "bg-yellow-50",
    icon: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    label: "Approaching",
  },
  at_capacity: {
    border: "border-orange-300",
    bg: "bg-orange-50",
    icon: "text-orange-600",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    label: "At Capacity",
  },
  over_capacity: {
    border: "border-red-300",
    bg: "bg-red-50",
    icon: "text-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    label: "Over Capacity",
  },
};

export function CapacityAlertCards({ alerts }: { alerts: CapacityAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const styles = ALERT_STYLES[alert.alertType];
        return (
          <div
            key={`${alert.employeeName}-${alert.alertType}`}
            className={`flex items-start gap-4 rounded-lg border ${styles.border} ${styles.bg} p-4`}
          >
            <div className="mt-0.5">
              <AlertTriangle size={20} strokeWidth={1.5} className={styles.icon} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${styles.badge}`}
                >
                  {styles.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-[#888]">
                  <Users size={12} strokeWidth={1.5} />
                  {alert.employeeName}
                </span>
                <span className="text-xs tabular-nums text-[#666]">
                  {alert.utilization.toFixed(0)}% utilized
                </span>
              </div>
              <p className="text-sm text-[#333]">{alert.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface HiringRecommendation {
  message: string;
  urgency: "low" | "medium" | "high";
}

export function HiringRecommendations({
  recommendations,
}: {
  recommendations: HiringRecommendation[];
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
      <div className="bg-[#fafafa] px-4 py-3 border-b border-[#e0e0e0] flex items-center gap-2">
        <UserPlus size={16} strokeWidth={1.5} className="text-[#666]" />
        <h3 className="text-sm font-medium">Hiring Recommendations</h3>
      </div>
      <div className="divide-y divide-[#f0f0f0]">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="px-4 py-3 flex items-start gap-3">
            <div
              className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                rec.urgency === "high"
                  ? "bg-red-500"
                  : rec.urgency === "medium"
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
            />
            <p className="text-sm text-[#333]">{rec.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
