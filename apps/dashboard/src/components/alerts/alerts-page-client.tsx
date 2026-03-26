"use client";

import { AskRouteCFO } from "@/components/ask-route-cfo";
import { createClient } from "@vendcfo/supabase/client";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  Server,
  Tag,
  TrendingDown,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmartAlert {
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  entity: string;
  message: string;
  count?: number;
  entityId?: string;
  entityName?: string;
  actionLabel?: string;
  actionHref?: string;
  metadata?: Record<string, unknown>;
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
      return (
        <AlertTriangle size={20} strokeWidth={1.5} className={className} />
      );
    case "warning":
      return (
        <AlertTriangle size={20} strokeWidth={1.5} className={className} />
      );
    case "info":
      return <Info size={20} strokeWidth={1.5} className={className} />;
  }
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "overdue_invoices":
    case "overdue_invoice":
      return <FileText size={16} strokeWidth={1.5} className="text-[#888]" />;
    case "uncategorized_transactions":
      return <Tag size={16} strokeWidth={1.5} className="text-[#888]" />;
    case "revenue_drop":
      return (
        <TrendingDown size={16} strokeWidth={1.5} className="text-[#888]" />
      );
    case "overdue_service":
      return <MapPin size={16} strokeWidth={1.5} className="text-[#888]" />;
    case "machine_down":
      return <Server size={16} strokeWidth={1.5} className="text-[#888]" />;
    default:
      return <Bell size={16} strokeWidth={1.5} className="text-[#888]" />;
  }
}

const TYPE_LABELS: Record<string, string> = {
  overdue_invoices: "Invoices",
  overdue_invoice: "Invoices",
  uncategorized_transactions: "Transactions",
  unpaid_invoices: "Invoices",
  revenue_drop: "Revenue",
  overdue_service: "Service",
  machine_down: "Machines",
  capacity_warning: "Capacity",
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AlertsPageClient({ teamId }: { teamId: string }) {
  const supabase = createClient();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const computeBasicAlerts = useCallback(async (): Promise<SmartAlert[]> => {
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
        title: "Overdue Invoices",
        entity: "Invoices",
        message: `${overdueCount} overdue invoice${overdueCount > 1 ? "s" : ""} need attention`,
        count: overdueCount,
        actionLabel: "View Invoices",
        actionHref: "/invoices",
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
        title: "Uncategorized Transactions",
        entity: "Transactions",
        message: `${uncategorizedCount} transaction${uncategorizedCount > 1 ? "s" : ""} need category review`,
        count: uncategorizedCount,
        actionLabel: "Categorize",
        actionHref: "/transactions",
      });
    }

    // 3. Unpaid invoices
    const { count: unpaidCount } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("status", "unpaid");

    if (unpaidCount && unpaidCount > 0) {
      results.push({
        type: "unpaid_invoices",
        severity: "info",
        title: "Unpaid Invoices",
        entity: "Invoices",
        message: `${unpaidCount} unpaid invoice${unpaidCount > 1 ? "s" : ""} outstanding`,
        count: unpaidCount,
        actionLabel: "View Invoices",
        actionHref: "/invoices",
      });
    }

    return results;
  }, [supabase, teamId]);

  const runSmartAnalysis = useCallback(async () => {
    setGenerating(true);

    try {
      const response = await fetch("/api/alerts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to generate alerts");
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Merge smart alerts with basic alerts
        const basicAlerts = await computeBasicAlerts();

        // Deduplicate: smart alerts for overdue invoices replace the basic one
        const smartTypes = new Set(result.data.map((a: SmartAlert) => a.type));
        const filteredBasic = basicAlerts.filter((a) => {
          if (
            a.type === "overdue_invoices" &&
            smartTypes.has("overdue_invoice")
          ) {
            return false;
          }
          return true;
        });

        const merged: SmartAlert[] = [
          ...result.data.map((a: any) => ({
            ...a,
            entity: TYPE_LABELS[a.type] ?? a.title,
          })),
          ...filteredBasic,
        ];

        // Sort by severity
        const severityOrder: Record<string, number> = {
          critical: 0,
          warning: 1,
          info: 2,
        };
        merged.sort(
          (a, b) =>
            (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3),
        );

        setAlerts(merged);
        setLastGenerated(result.meta?.generatedAt ?? new Date().toISOString());
        setDismissed(new Set());
      }
    } catch {
      // If smart analysis fails, fall back to basic alerts
      const basicAlerts = await computeBasicAlerts();
      setAlerts(basicAlerts);
    } finally {
      setGenerating(false);
    }
  }, [computeBasicAlerts]);

  // Initial load: basic alerts
  useEffect(() => {
    async function init() {
      setLoading(true);
      const basicAlerts = await computeBasicAlerts();
      setAlerts(basicAlerts);
      setLoading(false);
    }
    init();
  }, [computeBasicAlerts]);

  const handleDismiss = useCallback((alertKey: string) => {
    setDismissed((prev) => new Set([...prev, alertKey]));
  }, []);

  const visibleAlerts = alerts.filter(
    (a) => !dismissed.has(`${a.type}-${a.entityId ?? a.message}`),
  );

  const criticalCount = visibleAlerts.filter(
    (a) => a.severity === "critical",
  ).length;
  const warningCount = visibleAlerts.filter(
    (a) => a.severity === "warning",
  ).length;
  const infoCount = visibleAlerts.filter((a) => a.severity === "info").length;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Alerts Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI insights, profit leaks, and operational warnings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={runSmartAnalysis}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 text-sm font-medium text-[#333] hover:border-[#ccc] hover:bg-[#fafafa] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
            Run Analysis
          </button>
          <AskRouteCFO prompt="Review my business health and flag anything I should worry about" />
        </div>
      </div>

      {/* Summary badges */}
      {visibleAlerts.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
              <AlertTriangle size={12} />
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
              <AlertTriangle size={12} />
              {warningCount} Warning
            </span>
          )}
          {infoCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
              <Info size={12} />
              {infoCount} Info
            </span>
          )}
          {lastGenerated && (
            <span className="text-xs text-[#999] ml-auto">
              Last analysis:{" "}
              {new Date(lastGenerated).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#999]" />
        </div>
      ) : visibleAlerts.length === 0 ? (
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
          <button
            type="button"
            onClick={runSmartAnalysis}
            disabled={generating}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 text-sm font-medium text-[#333] hover:border-[#ccc] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
            Run Smart Analysis
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map((alert) => {
            const styles = SEVERITY_STYLES[alert.severity];
            const alertKey = `${alert.type}-${alert.entityId ?? alert.message}`;
            return (
              <div
                key={alertKey}
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
                      <TypeIcon type={alert.type} />
                      {alert.entity}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#333]">
                    {alert.message}
                  </p>
                  {/* Action link */}
                  {alert.actionLabel && alert.actionHref && (
                    <a
                      href={alert.actionHref}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#555] hover:text-[#333] transition-colors"
                    >
                      {alert.actionLabel}
                      <ChevronRight size={12} />
                    </a>
                  )}
                </div>
                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={() => handleDismiss(alertKey)}
                  className="mt-0.5 rounded p-1 text-[#999] hover:text-[#666] hover:bg-black/5 transition-colors"
                  title="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}

          <p className="mt-4 text-xs text-[#999]">
            {visibleAlerts.length} alert{visibleAlerts.length !== 1 ? "s" : ""}{" "}
            found
            {dismissed.size > 0 && ` (${dismissed.size} dismissed)`}
          </p>
        </div>
      )}
    </div>
  );
}
