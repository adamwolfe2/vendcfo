"use client";

import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { useCallback, useState } from "react";
import { RevenueSharePreviewTable } from "./revenue-share-preview";
import { SalesTaxPreviewTable } from "./sales-tax-preview";

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
  email_sent_at: string | null;
  report_data: Record<string, unknown>;
}

interface Props {
  report: GeneratedReport;
  onBack: () => void;
  onSendEmail: () => void;
  isSending: boolean;
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
    month: "long",
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
    month: "long",
    year: "numeric",
  });
  return `${fmt.format(startDate)} - ${fmt.format(endDate)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportPreview({
  report,
  onBack,
  onSendEmail,
  isSending,
}: Props) {
  const statusStyle = STATUS_STYLES[report.status] ?? STATUS_STYLES.draft;
  const data = report.report_data as Record<string, unknown>;
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = useCallback(async () => {
    setDownloadingPdf(true);

    try {
      const response = await fetch("/api/reports/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });

      if (!response.ok) {
        return;
      }

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
      // Silent fail — user can retry
    } finally {
      setDownloadingPdf(false);
    }
  }, [report.id]);

  return (
    <div className="w-full py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-[#878787] hover:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a1a]">
              {report.title}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-[#878787]">
                {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${statusStyle.className}`}
              >
                {statusStyle.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {report.report_type === "rev_share" && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 h-9 px-4 border border-[#e6e6e6] bg-white text-[#1a1a1a] text-sm font-medium hover:bg-[#fafafa] transition-colors disabled:opacity-50"
            >
              {downloadingPdf ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {downloadingPdf ? "Generating..." : "Download PDF"}
            </button>
          )}
          {report.email_to && report.status !== "sent" && (
            <button
              type="button"
              onClick={onSendEmail}
              disabled={isSending}
              className="inline-flex items-center gap-2 h-9 px-4 bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {isSending ? "Sending..." : "Send Email"}
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="border border-[#e6e6e6] p-3">
          <div className="flex items-center gap-1.5 text-[#878787] text-xs font-medium uppercase tracking-wide mb-1">
            <Calendar size={12} />
            Period
          </div>
          <p className="text-sm font-medium text-[#1a1a1a]">
            {formatPeriod(report.period_start, report.period_end)}
          </p>
        </div>
        <div className="border border-[#e6e6e6] p-3">
          <div className="flex items-center gap-1.5 text-[#878787] text-xs font-medium uppercase tracking-wide mb-1">
            <FileText size={12} />
            Created
          </div>
          <p className="text-sm font-medium text-[#1a1a1a]">
            {formatDate(report.created_at)}
          </p>
        </div>
        {report.email_to && (
          <div className="border border-[#e6e6e6] p-3">
            <div className="flex items-center gap-1.5 text-[#878787] text-xs font-medium uppercase tracking-wide mb-1">
              <Mail size={12} />
              Recipient
            </div>
            <p className="text-sm font-medium text-[#1a1a1a] truncate">
              {report.email_to}
            </p>
          </div>
        )}
        {report.email_sent_at && (
          <div className="border border-[#e6e6e6] p-3">
            <div className="flex items-center gap-1.5 text-[#878787] text-xs font-medium uppercase tracking-wide mb-1">
              <Send size={12} />
              Sent
            </div>
            <p className="text-sm font-medium text-[#1a1a1a]">
              {formatDate(report.email_sent_at)}
            </p>
          </div>
        )}
      </div>

      {/* Report Data */}
      {report.report_type === "rev_share" && data.lineItems ? (
        <RevenueSharePreviewTable
          lineItems={
            (data.lineItems as Array<{
              locationId: string;
              locationName: string;
              grossRevenue: number;
              processingFees: number;
              netDeposited: number;
              sharePercentage: number;
              commissionAmount: number;
            }>) ?? []
          }
          totalGrossRevenue={Number(data.totalGrossRevenue ?? 0)}
          totalCommission={Number(data.totalCommission ?? 0)}
          periodLabel={String(data.periodLabel ?? "")}
        />
      ) : report.report_type === "sales_tax" && data.lineItems ? (
        <SalesTaxPreviewTable
          lineItems={
            (data.lineItems as Array<{
              jurisdiction: string;
              taxRate: number;
              taxableAmount: number;
              taxAmount: number;
            }>) ?? []
          }
          totalTaxableAmount={Number(data.totalTaxableAmount ?? 0)}
          totalTaxAmount={Number(data.totalTaxAmount ?? 0)}
          periodLabel={String(data.periodLabel ?? "")}
        />
      ) : (
        <div className="border border-[#e6e6e6] p-8 text-center">
          <FileText size={32} className="mx-auto text-[#ccc] mb-3" />
          <p className="text-sm text-[#878787]">
            Report data is available in JSON format.
          </p>
          <pre className="mt-4 text-left text-xs bg-[#f9f9f9] p-4 overflow-auto max-h-64 border border-[#e6e6e6]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {/* Email Preview */}
      {(report.email_subject || report.email_body) && (
        <div className="mt-6 border border-[#e6e6e6]">
          <div className="bg-[#f9f9f9] px-5 py-3 border-b border-[#e6e6e6]">
            <h3 className="text-xs font-semibold text-[#878787] uppercase tracking-wide">
              Email Draft
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {report.email_to && (
              <div>
                <span className="text-xs font-medium text-[#878787]">To: </span>
                <span className="text-sm text-[#1a1a1a]">
                  {report.email_to}
                </span>
              </div>
            )}
            {report.email_subject && (
              <div>
                <span className="text-xs font-medium text-[#878787]">
                  Subject:{" "}
                </span>
                <span className="text-sm font-medium text-[#1a1a1a]">
                  {report.email_subject}
                </span>
              </div>
            )}
            {report.email_body && (
              <div className="pt-2 border-t border-[#f0f0f0]">
                <pre className="text-sm text-[#333] whitespace-pre-wrap font-sans leading-relaxed">
                  {report.email_body}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
