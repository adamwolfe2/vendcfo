"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { createClient } from "@vendcfo/supabase/client";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmartAlert {
  type: string;
  severity: "critical" | "warning" | "info";
  entity: string;
  message: string;
  count: number;
}

const SEVERITY_STYLES: Record<
  SmartAlert["severity"],
  { border: string; bg: string; icon: string; badge: string }
> = {
  critical: {
    border: "border-red-300",
    bg: "bg-red-50",
    icon: "text-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  warning: {
    border: "border-yellow-300",
    bg: "bg-yellow-50",
    icon: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  info: {
    border: "border-blue-300",
    bg: "bg-blue-50",
    icon: "text-blue-500",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

function SeverityIcon({
  severity,
  className,
}: {
  severity: SmartAlert["severity"];
  className?: string;
}) {
  switch (severity) {
    case "critical":
      return <AlertTriangle size={20} strokeWidth={1.5} className={className} />;
    case "warning":
      return <AlertTriangle size={20} strokeWidth={1.5} className={className} />;
    case "info":
      return <Info size={20} strokeWidth={1.5} className={className} />;
  }
}

function EntityIcon({ type }: { type: string }) {
  switch (type) {
    case "overdue_invoices":
      return <FileText size={16} strokeWidth={1.5} className="text-[#888]" />;
    case "uncategorized_transactions":
      return <Tag size={16} strokeWidth={1.5} className="text-[#888]" />;
    default:
      return <Bell size={16} strokeWidth={1.5} className="text-[#888]" />;
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AlertsPageClient({ teamId }: { teamId: string }) {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function computeAlerts() {
      setLoading(true);
      const results: SmartAlert[] = [];

      // 1. Overdue invoices
      const { count: overdueCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId)
        .eq("status", "overdue");

      if (overdueCount && overdueCount > 0) {
        results.push({
          type: "overdue_invoices",
          severity: overdueCount >= 5 ? "critical" : "warning",
          entity: "Invoices",
          message: `${overdueCount} overdue invoice${overdueCount > 1 ? "s" : ""} need attention`,
          count: overdueCount,
        });
      }

      // 2. Uncategorized transactions
      const { count: uncategorizedCount } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId)
        .is("category_slug", null);

      if (uncategorizedCount && uncategorizedCount > 0) {
        results.push({
          type: "uncategorized_transactions",
          severity: uncategorizedCount >= 50 ? "warning" : "info",
          entity: "Transactions",
          message: `${uncategorizedCount} transaction${uncategorizedCount > 1 ? "s" : ""} need category review`,
          count: uncategorizedCount,
        });
      }

      // 3. Unpaid invoices (not yet overdue but pending)
      const { count: unpaidCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId)
        .eq("status", "unpaid");

      if (unpaidCount && unpaidCount > 0) {
        results.push({
          type: "unpaid_invoices",
          severity: "info",
          entity: "Invoices",
          message: `${unpaidCount} unpaid invoice${unpaidCount > 1 ? "s" : ""} outstanding`,
          count: unpaidCount,
        });
      }

      setAlerts(results);
      setLoading(false);
    }

    computeAlerts();
  }, [supabase, teamId]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Alerts Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI insights, profit leaks, and operational warnings.
          </p>
        </div>
        <AskRouteCFO prompt="Review my business health and flag anything I should worry about" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#999]" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="border border-dashed border-[#ddd] rounded-lg p-12 text-center">
          <CheckCircle2
            className="mx-auto mb-4 text-green-400"
            size={40}
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-[#555]">
            All clear -- no alerts
          </p>
          <p className="text-xs text-[#999] mt-1">
            Alerts will appear here when unusual activity is detected in your
            operations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const styles = SEVERITY_STYLES[alert.severity];
            return (
              <div
                key={alert.type}
                className={`flex items-start gap-4 rounded-lg border ${styles.border} ${styles.bg} p-4`}
              >
                <div className="mt-0.5">
                  <SeverityIcon
                    severity={alert.severity}
                    className={styles.icon}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${styles.badge}`}
                    >
                      {alert.severity === "critical"
                        ? "Critical"
                        : alert.severity === "warning"
                          ? "Warning"
                          : "Info"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-[#888]">
                      <EntityIcon type={alert.type} />
                      {alert.entity}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#333]">
                    {alert.message}
                  </p>
                </div>
              </div>
            );
          })}

          <p className="mt-4 text-xs text-[#999]">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""} found
          </p>
        </div>
      )}
    </div>
  );
}
