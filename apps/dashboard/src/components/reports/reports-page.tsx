"use client";

import { createClient } from "@vendcfo/supabase/client";
import {
  Calendar,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Loader2,
  Mail,
  Plus,
} from "lucide-react";
import { useCallback, useState } from "react";
import { ReportGenerationWizard } from "./report-generation-wizard";
import { ReportPreview } from "./report-preview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeneratedReport {
  id: string;
  report_type: string;
  title: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  email_to: string | null;
  email_subject: string | null;
  email_body: string | null;
  email_sent_at: string | null;
  report_data: Record<string, unknown>;
}

interface Location {
  id: string;
  name: string;
  rev_share_pct: number | null;
  contact_name: string | null;
  contact_email: string | null;
}

interface LocationGroup {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
}

interface Props {
  teamId: string;
  teamName: string;
  userId: string;
  initialReports: GeneratedReport[];
  locations: Location[];
  locationGroups: LocationGroup[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_TYPE_LABELS: Record<string, string> = {
  rev_share: "Revenue Share / Commission",
  sales_tax: "Sales Tax",
  profitability: "Profitability",
  employee_productivity: "Employee Productivity",
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-[#f3f4f6] text-[#374151] border-[#d1d5db]",
  },
  generated: {
    label: "Generated",
    className: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
  },
  sent: {
    label: "Sent",
    className: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPeriod(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();
  const year = endDate.getFullYear();

  if (endMonth - startMonth === 2 && startMonth % 3 === 0) {
    const quarter = Math.floor(startMonth / 3) + 1;
    return `Q${quarter} ${year}`;
  }

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(startDate)} - ${fmt.format(endDate)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportsPage({
  teamId,
  teamName,
  userId,
  initialReports,
  locations,
  locationGroups,
}: Props) {
  const [reports, setReports] = useState<GeneratedReport[]>(initialReports);
  const [showWizard, setShowWizard] = useState(false);
  const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(
    null,
  );
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refreshReports = useCallback(async () => {
    const supabase: any = createClient();
    const { data } = await supabase
      .from("generated_reports")
      .select("*")
      .eq("business_id", teamId)
      .order("created_at", { ascending: false });

    if (data) {
      setReports(data);
    }
  }, [teamId]);

  const handleReportGenerated = useCallback(
    (report: GeneratedReport) => {
      setReports((prev) => [report, ...prev]);
      setShowWizard(false);
      setPreviewReport(report);
    },
    [],
  );

  const handleDownloadPdf = useCallback(
    async (report: GeneratedReport, e: React.MouseEvent) => {
      e.stopPropagation();
      if (report.report_type !== "rev_share") return;

      setDownloadingId(report.id);

      try {
        const response = await fetch("/api/reports/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: report.id }),
        });

        if (!response.ok) return;

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download =
          response.headers
            .get("Content-Disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") ?? `Report-${report.id}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      } catch {
        // Silent fail
      } finally {
        setDownloadingId(null);
      }
    },
    [],
  );

  const handleSendEmail = useCallback(
    async (report: GeneratedReport) => {
      if (!report.email_to) return;
      setSendingId(report.id);

      try {
        const response = await fetch("/api/reports/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId: report.id }),
        });

        if (response.ok) {
          await refreshReports();
        }
      } catch (err) {
        // Error handling without console.log
      } finally {
        setSendingId(null);
      }
    },
    [refreshReports],
  );

  // ---------------------------------------------------------------------------
  // Render: Wizard
  // ---------------------------------------------------------------------------

  if (showWizard) {
    return (
      <ReportGenerationWizard
        teamId={teamId}
        teamName={teamName}
        userId={userId}
        locations={locations}
        locationGroups={locationGroups}
        onComplete={handleReportGenerated as any}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Preview
  // ---------------------------------------------------------------------------

  if (previewReport) {
    return (
      <ReportPreview
        report={previewReport}
        onBack={() => setPreviewReport(null)}
        onSendEmail={() => handleSendEmail(previewReport)}
        isSending={sendingId === previewReport.id}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Reports List
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1a1a1a]">Reports</h1>
          <p className="text-sm text-[#878787] mt-1">
            Generate and send quarterly reports to property managers and
            stakeholders
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333] transition-colors w-full sm:w-auto"
        >
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-[#e6e6e6] p-4">
          <div className="flex items-center gap-2 text-[#878787] text-xs font-medium uppercase tracking-wide mb-2">
            <FileText size={14} />
            Total Reports
          </div>
          <p className="text-2xl font-semibold text-[#1a1a1a]">
            {reports.length}
          </p>
        </div>
        <div className="border border-[#e6e6e6] p-4">
          <div className="flex items-center gap-2 text-[#878787] text-xs font-medium uppercase tracking-wide mb-2">
            <Clock size={14} />
            Pending
          </div>
          <p className="text-2xl font-semibold text-[#1a1a1a]">
            {reports.filter((r) => r.status !== "sent").length}
          </p>
        </div>
        <div className="border border-[#e6e6e6] p-4">
          <div className="flex items-center gap-2 text-[#878787] text-xs font-medium uppercase tracking-wide mb-2">
            <Mail size={14} />
            Sent
          </div>
          <p className="text-2xl font-semibold text-[#1a1a1a]">
            {reports.filter((r) => r.status === "sent").length}
          </p>
        </div>
      </div>

      {/* Reports Table */}
      {reports.length === 0 ? (
        <div className="border border-[#e6e6e6] p-12 text-center">
          <FileText size={40} className="mx-auto text-[#ccc] mb-4" />
          <h3 className="text-lg font-medium text-[#1a1a1a] mb-2">
            No reports yet
          </h3>
          <p className="text-sm text-[#878787] mb-6 max-w-md mx-auto">
            Generate your first quarterly report to streamline revenue share
            calculations and send professional reports to your property managers.
          </p>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 h-9 px-4 bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333] transition-colors"
          >
            <Plus size={16} />
            Generate Report
          </button>
        </div>
      ) : (
        <div className="border border-[#e6e6e6] overflow-hidden">
          {/* Desktop Table Header - hidden on mobile */}
          <div className="hidden sm:grid grid-cols-[1fr_160px_120px_100px_120px_40px_40px] gap-4 px-4 py-3 bg-[#f9f9f9] border-b border-[#e6e6e6] text-xs font-medium text-[#878787] uppercase tracking-wide">
            <div>Title</div>
            <div>Type</div>
            <div>Period</div>
            <div>Status</div>
            <div>Created</div>
            <div />
            <div />
          </div>

          {/* Table Rows */}
          {reports.map((report) => {
            const statusStyle = (STATUS_STYLES[report.status] ??
              STATUS_STYLES.draft)!;

            return (
              <div
                key={report.id}
                className="w-full flex flex-col gap-2 px-4 py-3 border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#fafafa] transition-colors text-left min-h-[44px] sm:grid sm:grid-cols-[1fr_160px_120px_100px_120px_40px_40px] sm:gap-4 sm:items-center"
              >
                <button
                  type="button"
                  onClick={() => setPreviewReport(report)}
                  className="flex items-center gap-3 min-w-0 text-left"
                >
                  <FileText size={16} className="text-[#878787] shrink-0" />
                  <span className="text-sm font-medium text-[#1a1a1a] truncate">
                    {report.title}
                  </span>
                  <ChevronRight size={14} className="text-[#ccc] ml-auto sm:hidden shrink-0" />
                </button>
                <div className="flex items-center gap-2 sm:gap-0 flex-wrap sm:contents pl-7 sm:pl-0">
                  <span className="text-xs sm:text-sm text-[#666]">
                    {REPORT_TYPE_LABELS[report.report_type] ??
                      report.report_type}
                  </span>
                  <span className="text-xs text-[#999] sm:hidden">--</span>
                  <span className="text-xs sm:text-sm text-[#666] sm:flex sm:items-center">
                    {formatPeriod(report.period_start, report.period_end)}
                  </span>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${statusStyle.className}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-[#878787] sm:flex sm:items-center">
                    {formatDate(report.created_at)}
                  </span>
                </div>
                <div className="hidden sm:flex items-center justify-end">
                  {report.report_type === "rev_share" ? (
                    <button
                      type="button"
                      onClick={(e) => handleDownloadPdf(report, e)}
                      disabled={downloadingId === report.id}
                      className="p-1 text-[#878787] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
                      title="Download PDF"
                    >
                      {downloadingId === report.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                    </button>
                  ) : (
                    <div className="w-[14px]" />
                  )}
                </div>
                <div className="hidden sm:flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewReport(report)}
                    className="p-1 text-[#ccc] hover:text-[#1a1a1a] transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
