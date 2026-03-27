"use client";

import { createClient } from "@vendcfo/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronDown,
  Download,
  Loader2,
  Send,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { RevenueSharePreviewTable } from "./revenue-share-preview";
import { SalesTaxPreviewTable } from "./sales-tax-preview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface RevenueShareLineItem {
  locationId: string;
  locationName: string;
  grossRevenue: number;
  processingFees: number;
  netDeposited: number;
  sharePercentage: number;
  commissionAmount: number;
}

interface SalesTaxLineItem {
  jurisdiction: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
}

type ReportType =
  | "rev_share"
  | "sales_tax"
  | "profitability"
  | "employee_productivity";

type WizardStep = "type" | "period" | "scope" | "preview" | "email";

interface Props {
  teamId: string;
  teamName: string;
  userId: string;
  locations: Location[];
  locationGroups: LocationGroup[];
  onComplete: (report: Record<string, unknown>) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: "rev_share",
    label: "Revenue Share / Commission",
    description:
      "Calculate revenue share owed to property managers based on location performance.",
  },
  {
    value: "sales_tax",
    label: "Sales Tax",
    description:
      "Summarize taxable amounts and tax collected by jurisdiction for quarterly filing.",
  },
  {
    value: "profitability",
    label: "Profitability",
    description:
      "Analyze profitability at the route or business level for the period.",
  },
  {
    value: "employee_productivity",
    label: "Employee Productivity",
    description:
      "Review employee hours, stops, and efficiency metrics for the quarter.",
  },
];

function getPreviousQuarter(): { start: string; end: string; label: string } {
  const now = new Date();
  let quarter = Math.floor(now.getMonth() / 3) - 1;
  let year = now.getFullYear();
  if (quarter < 0) {
    quarter = 3;
    year -= 1;
  }
  const startMonth = quarter * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: `Q${quarter + 1} ${year}`,
  };
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportGenerationWizard({
  teamId,
  teamName,
  userId,
  locations,
  locationGroups,
  onComplete,
  onCancel,
}: Props) {
  const prevQuarter = useMemo(() => getPreviousQuarter(), []);

  // Wizard state
  const [step, setStep] = useState<WizardStep>("type");
  const [reportType, setReportType] = useState<ReportType>("rev_share");

  // Period state
  const [periodMode, setPeriodMode] = useState<"previous_quarter" | "custom">(
    "previous_quarter",
  );
  const [customStart, setCustomStart] = useState(prevQuarter.start);
  const [customEnd, setCustomEnd] = useState(prevQuarter.end);

  // Scope state
  const [scopeMode, setScopeMode] = useState<
    "all" | "group" | "individual" | "jurisdiction"
  >("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("");

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [revShareData, setRevShareData] = useState<{
    lineItems: RevenueShareLineItem[];
    totalGrossRevenue: number;
    totalCommission: number;
    periodLabel: string;
  } | null>(null);
  const [salesTaxData, setSalesTaxData] = useState<{
    lineItems: SalesTaxLineItem[];
    totalTaxableAmount: number;
    totalTaxAmount: number;
    periodLabel: string;
  } | null>(null);

  // Email state
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Submission
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const periodStart =
    periodMode === "previous_quarter" ? prevQuarter.start : customStart;
  const periodEnd =
    periodMode === "previous_quarter" ? prevQuarter.end : customEnd;
  const periodLabel =
    periodMode === "previous_quarter"
      ? prevQuarter.label
      : `${customStart} to ${customEnd}`;

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  const steps: WizardStep[] = useMemo(() => {
    return ["type", "period", "scope", "preview", "email"];
  }, []);

  const currentStepIndex = steps.indexOf(step);
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < steps.length - 1;

  const goBack = useCallback(() => {
    if (canGoBack) {
      setStep(steps[currentStepIndex - 1]!);
    }
  }, [canGoBack, currentStepIndex, steps]);

  // ---------------------------------------------------------------------------
  // Preview calculation
  // ---------------------------------------------------------------------------

  const calculatePreview = useCallback(async () => {
    setPreviewLoading(true);
    const supabase: any = createClient();

    try {
      if (reportType === "rev_share") {
        // Fetch revenue records
        let query = supabase
          .from("revenue_records")
          .select("location_id, gross_revenue, processing_fees, net_deposited")
          .eq("business_id", teamId)
          .gte("period_start", periodStart)
          .lte("period_end", periodEnd);

        if (
          scopeMode === "individual" &&
          selectedLocationIds.length > 0
        ) {
          query = query.in("location_id", selectedLocationIds);
        }

        const { data: revenueData } = await query;

        // Group by location
        const locationRevMap = new Map<
          string,
          { gross: number; fees: number; net: number }
        >();

        for (const row of revenueData ?? []) {
          const existing = locationRevMap.get(row.location_id) ?? {
            gross: 0,
            fees: 0,
            net: 0,
          };
          locationRevMap.set(row.location_id, {
            gross: existing.gross + Number(row.gross_revenue ?? 0),
            fees: existing.fees + Number(row.processing_fees ?? 0),
            net: existing.net + Number(row.net_deposited ?? 0),
          });
        }

        // Build line items using location data
        const targetLocations =
          scopeMode === "individual" && selectedLocationIds.length > 0
            ? locations.filter((l) => selectedLocationIds.includes(l.id))
            : locations;

        const lineItems: RevenueShareLineItem[] = targetLocations
          .filter((loc) => Number(loc.rev_share_pct ?? 0) > 0)
          .map((loc) => {
            const rev = locationRevMap.get(loc.id) ?? {
              gross: 0,
              fees: 0,
              net: 0,
            };
            const sharePercentage = Number(loc.rev_share_pct ?? 0);
            const commissionAmount = (rev.gross * sharePercentage) / 100;
            return {
              locationId: loc.id,
              locationName: loc.name,
              grossRevenue: rev.gross,
              processingFees: rev.fees,
              netDeposited: rev.net,
              sharePercentage,
              commissionAmount,
            };
          });

        const totalGrossRevenue = lineItems.reduce(
          (s, i) => s + i.grossRevenue,
          0,
        );
        const totalCommission = lineItems.reduce(
          (s, i) => s + i.commissionAmount,
          0,
        );

        setRevShareData({
          lineItems,
          totalGrossRevenue,
          totalCommission,
          periodLabel,
        });

        // Pre-populate email
        const contactLoc = targetLocations.find((l) => l.contact_email);
        const selectedGroup = locationGroups.find(
          (g) => g.id === selectedGroupId,
        );
        const recipientEmail =
          selectedGroup?.contact_email ?? contactLoc?.contact_email ?? "";
        const recipientName =
          selectedGroup?.contact_name ?? contactLoc?.contact_name ?? "";

        setEmailTo(recipientEmail);
        setEmailSubject(
          `Revenue Share Report - ${periodLabel}${teamName ? ` - ${teamName}` : ""}`,
        );
        setEmailBody(
          `Hi ${recipientName || "there"},\n\nPlease find the revenue share report for ${periodLabel}.\n\nTotal Gross Revenue: ${fmt(totalGrossRevenue)}\nTotal Commission Due: ${fmt(totalCommission)}\n\nPlease review the details above and let us know if you have any questions.\n\nBest regards${teamName ? `,\n${teamName}` : ""}`,
        );
      } else if (reportType === "sales_tax") {
        let query = supabase
          .from("sales_tax_records")
          .select("jurisdiction, tax_rate, taxable_amount, tax_amount")
          .eq("business_id", teamId)
          .gte("period_start", periodStart)
          .lte("period_end", periodEnd);

        if (selectedJurisdiction) {
          query = query.eq("jurisdiction", selectedJurisdiction);
        }

        const { data: taxData } = await query;

        // Group by jurisdiction
        const jurisdictionMap = new Map<
          string,
          { rate: number; taxable: number; tax: number; count: number }
        >();

        for (const row of taxData ?? []) {
          const existing = jurisdictionMap.get(row.jurisdiction) ?? {
            rate: 0,
            taxable: 0,
            tax: 0,
            count: 0,
          };
          jurisdictionMap.set(row.jurisdiction, {
            rate: existing.rate + Number(row.tax_rate ?? 0),
            taxable: existing.taxable + Number(row.taxable_amount ?? 0),
            tax: existing.tax + Number(row.tax_amount ?? 0),
            count: existing.count + 1,
          });
        }

        const lineItems: SalesTaxLineItem[] = Array.from(
          jurisdictionMap.entries(),
        ).map(([jurisdiction, data]) => ({
          jurisdiction,
          taxRate: data.count > 0 ? data.rate / data.count : 0,
          taxableAmount: data.taxable,
          taxAmount: data.tax,
        }));

        const totalTaxableAmount = lineItems.reduce(
          (s, i) => s + i.taxableAmount,
          0,
        );
        const totalTaxAmount = lineItems.reduce(
          (s, i) => s + i.taxAmount,
          0,
        );

        setSalesTaxData({
          lineItems,
          totalTaxableAmount,
          totalTaxAmount,
          periodLabel,
        });

        setEmailTo("");
        setEmailSubject(
          `Sales Tax Report - ${periodLabel}${teamName ? ` - ${teamName}` : ""}`,
        );
        setEmailBody(
          `Quarterly sales tax summary for ${periodLabel}.\n\nTotal Taxable Amount: ${fmt(totalTaxableAmount)}\nTotal Tax Collected: ${fmt(totalTaxAmount)}\n\nPlease review for filing.${teamName ? `\n\nBest regards,\n${teamName}` : ""}`,
        );
      }
    } catch (err) {
      // Error state will show empty preview
    } finally {
      setPreviewLoading(false);
    }
  }, [
    reportType,
    teamId,
    teamName,
    periodStart,
    periodEnd,
    periodLabel,
    scopeMode,
    selectedLocationIds,
    selectedGroupId,
    selectedJurisdiction,
    locations,
    locationGroups,
  ]);

  const goForward = useCallback(async () => {
    if (step === "scope") {
      await calculatePreview();
      setStep("preview");
    } else if (canGoForward) {
      setStep(steps[currentStepIndex + 1]!);
    }
  }, [canGoForward, currentStepIndex, steps, step, calculatePreview]);

  // ---------------------------------------------------------------------------
  // Save report
  // ---------------------------------------------------------------------------

  const handleGenerate = useCallback(
    async (shouldSendEmail = false) => {
      setSaving(true);
      setSendError(null);
      const supabase: any = createClient();

      const reportData =
        reportType === "rev_share"
          ? revShareData
          : reportType === "sales_tax"
            ? salesTaxData
            : {};

      const title = `${REPORT_TYPES.find((t) => t.value === reportType)?.label ?? reportType} - ${periodLabel}`;

      try {
        const { data, error } = await supabase
          .from("generated_reports")
          .insert({
            business_id: teamId,
            report_type: reportType,
            title,
            period_start: periodStart,
            period_end: periodEnd,
            location_group_id:
              scopeMode === "group" && selectedGroupId
                ? selectedGroupId
                : null,
            report_data: reportData ?? {},
            email_to: emailTo || null,
            email_subject: emailSubject || null,
            email_body: emailBody || null,
            status: "generated",
            created_by: userId,
          })
          .select()
          .single();

        if (error) throw error;

        if (data && shouldSendEmail && emailTo) {
          setSaving(false);
          setSending(true);

          try {
            const response = await fetch("/api/reports/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reportId: data.id }),
            });

            if (!response.ok) {
              const errBody = (await response
                .json()
                .catch(() => ({}))) as Record<string, unknown>;
              setSendError(
                String(errBody.error ?? "Failed to send email"),
              );
              setSending(false);
              onComplete({ ...data, status: "generated" });
              return;
            }

            setSendSuccess(true);
            setSending(false);

            // Brief delay to show success before navigating away
            setTimeout(() => {
              onComplete({ ...data, status: "sent" });
            }, 1500);
          } catch {
            setSendError("Failed to send email. Report was saved.");
            setSending(false);
            onComplete({ ...data, status: "generated" });
          }
        } else if (data) {
          onComplete(data);
        }
      } catch {
        setSendError("Failed to save report. Please try again.");
        setSaving(false);
      }
    },
    [
      teamId,
      userId,
      reportType,
      periodStart,
      periodEnd,
      periodLabel,
      scopeMode,
      selectedGroupId,
      revShareData,
      salesTaxData,
      emailTo,
      emailSubject,
      emailBody,
      onComplete,
    ],
  );

  // ---------------------------------------------------------------------------
  // Download PDF
  // ---------------------------------------------------------------------------

  const handleDownloadPdf = useCallback(async () => {
    setDownloadingPdf(true);

    try {
      const response = await fetch("/api/reports/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          periodStart,
          periodEnd,
          locationIds:
            scopeMode === "individual" && selectedLocationIds.length > 0
              ? selectedLocationIds
              : undefined,
        }),
      });

      if (!response.ok) {
        const errBody = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        setSendError(String(errBody.error ?? "Failed to generate PDF"));
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ??
        `Revenue-Share-Report-${periodLabel.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setSendError("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  }, [
    reportType,
    periodStart,
    periodEnd,
    periodLabel,
    scopeMode,
    selectedLocationIds,
  ]);

  // ---------------------------------------------------------------------------
  // Step indicator
  // ---------------------------------------------------------------------------

  const stepLabels: Record<WizardStep, string> = {
    type: "Report Type",
    period: "Period",
    scope: "Scope",
    preview: "Preview",
    email: "Email Draft",
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[#878787] hover:text-[#1a1a1a] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-[#1a1a1a]">
          Generate Report
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 sm:gap-2 mb-8 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div
              className={`flex items-center justify-center w-6 h-6 text-xs font-medium border ${
                i < currentStepIndex
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : i === currentStepIndex
                    ? "bg-white text-[#1a1a1a] border-[#1a1a1a]"
                    : "bg-white text-[#ccc] border-[#e6e6e6]"
              }`}
            >
              {i < currentStepIndex ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                i <= currentStepIndex ? "text-[#1a1a1a]" : "text-[#ccc]"
              }`}
            >
              {stepLabels[s]}
            </span>
            {i < steps.length - 1 && (
              <div className="w-4 sm:w-8 h-px bg-[#e6e6e6]" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="border border-[#e6e6e6] p-6 mb-6">
        {step === "type" && (
          <StepSelectType value={reportType} onChange={setReportType} />
        )}
        {step === "period" && (
          <StepSelectPeriod
            mode={periodMode}
            onModeChange={setPeriodMode}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
            prevQuarterLabel={prevQuarter.label}
          />
        )}
        {step === "scope" && (
          <StepSelectScope
            reportType={reportType}
            scopeMode={scopeMode}
            onScopeModeChange={setScopeMode}
            locations={locations}
            locationGroups={locationGroups}
            selectedGroupId={selectedGroupId}
            onGroupChange={setSelectedGroupId}
            selectedLocationIds={selectedLocationIds}
            onLocationIdsChange={setSelectedLocationIds}
            selectedJurisdiction={selectedJurisdiction}
            onJurisdictionChange={setSelectedJurisdiction}
          />
        )}
        {step === "preview" && (
          <StepPreview
            loading={previewLoading}
            reportType={reportType}
            revShareData={revShareData}
            salesTaxData={salesTaxData}
            periodLabel={periodLabel}
          />
        )}
        {step === "email" && (
          <StepEmailDraft
            emailTo={emailTo}
            onEmailToChange={setEmailTo}
            emailSubject={emailSubject}
            onEmailSubjectChange={setEmailSubject}
            emailBody={emailBody}
            onEmailBodyChange={setEmailBody}
          />
        )}
      </div>

      {/* Send success overlay */}
      {sendSuccess && (
        <div className="mb-6 flex items-center gap-3 border border-[#bbf7d0] bg-[#dcfce7] px-4 py-3">
          <CheckCircle size={16} className="text-[#166534]" />
          <p className="text-sm font-medium text-[#166534]">
            Report generated and email sent successfully.
          </p>
        </div>
      )}

      {/* Send error */}
      {sendError && (
        <div className="mb-6 flex items-center gap-3 border border-[#fecaca] bg-[#fef2f2] px-4 py-3">
          <p className="text-sm font-medium text-[#dc2626]">{sendError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={canGoBack ? goBack : onCancel}
          disabled={saving || sending || sendSuccess}
          className="inline-flex items-center gap-1 text-sm text-[#878787] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={14} />
          {canGoBack ? "Back" : "Cancel"}
        </button>

        {step === "email" ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleGenerate(false)}
              disabled={saving || sending || sendSuccess}
              className="inline-flex items-center gap-2 h-9 px-5 border border-[#e6e6e6] bg-white text-[#1a1a1a] text-sm font-medium hover:bg-[#fafafa] transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {saving ? "Saving..." : "Save Only"}
            </button>
            {reportType === "rev_share" && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={saving || sending || sendSuccess || downloadingPdf}
                className="inline-flex items-center gap-2 h-9 px-5 border border-[#e6e6e6] bg-white text-[#1a1a1a] text-sm font-medium hover:bg-[#fafafa] transition-colors disabled:opacity-50"
              >
                {downloadingPdf ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {downloadingPdf ? "Generating..." : "Download PDF"}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              disabled={saving || sending || sendSuccess || !emailTo}
              className="inline-flex items-center gap-2 h-9 px-5 bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : sendSuccess ? (
                <CheckCircle size={14} />
              ) : (
                <Send size={14} />
              )}
              {sending
                ? "Sending..."
                : sendSuccess
                  ? "Sent"
                  : "Generate & Send"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={goForward}
            disabled={previewLoading}
            className="inline-flex items-center gap-1 h-9 px-5 bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {previewLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                Next
                <ArrowRight size={14} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Select Report Type
// ---------------------------------------------------------------------------

function StepSelectType({
  value,
  onChange,
}: {
  value: ReportType;
  onChange: (v: ReportType) => void;
}) {
  return (
    <div>
      <h2 className="text-base font-medium text-[#1a1a1a] mb-1">
        Select Report Type
      </h2>
      <p className="text-sm text-[#878787] mb-4">
        Choose the type of quarterly report to generate.
      </p>
      <div className="space-y-2">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt.value}
            type="button"
            onClick={() => onChange(rt.value)}
            className={`w-full text-left p-4 border transition-colors ${
              value === rt.value
                ? "border-[#1a1a1a] bg-[#fafafa]"
                : "border-[#e6e6e6] hover:border-[#ccc]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                  value === rt.value
                    ? "border-[#1a1a1a]"
                    : "border-[#ccc]"
                }`}
              >
                {value === rt.value && (
                  <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">
                  {rt.label}
                </p>
                <p className="text-xs text-[#878787] mt-0.5">
                  {rt.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Select Period
// ---------------------------------------------------------------------------

function StepSelectPeriod({
  mode,
  onModeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  prevQuarterLabel,
}: {
  mode: "previous_quarter" | "custom";
  onModeChange: (m: "previous_quarter" | "custom") => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
  prevQuarterLabel: string;
}) {
  return (
    <div>
      <h2 className="text-base font-medium text-[#1a1a1a] mb-1">
        Select Period
      </h2>
      <p className="text-sm text-[#878787] mb-4">
        Choose the date range for this report.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onModeChange("previous_quarter")}
          className={`w-full text-left p-4 border transition-colors ${
            mode === "previous_quarter"
              ? "border-[#1a1a1a] bg-[#fafafa]"
              : "border-[#e6e6e6] hover:border-[#ccc]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                mode === "previous_quarter"
                  ? "border-[#1a1a1a]"
                  : "border-[#ccc]"
              }`}
            >
              {mode === "previous_quarter" && (
                <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">
                Previous Quarter ({prevQuarterLabel})
              </p>
              <p className="text-xs text-[#878787] mt-0.5">
                Automatically selects the most recent completed quarter.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("custom")}
          className={`w-full text-left p-4 border transition-colors ${
            mode === "custom"
              ? "border-[#1a1a1a] bg-[#fafafa]"
              : "border-[#e6e6e6] hover:border-[#ccc]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                mode === "custom" ? "border-[#1a1a1a]" : "border-[#ccc]"
              }`}
            >
              {mode === "custom" && (
                <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
              )}
            </div>
            <p className="text-sm font-medium text-[#1a1a1a]">
              Custom Date Range
            </p>
          </div>
        </button>

        {mode === "custom" && (
          <div className="flex items-center gap-4 pl-7 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#878787] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => onCustomStartChange(e.target.value)}
                className="h-9 px-3 border border-[#e6e6e6] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#878787] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => onCustomEndChange(e.target.value)}
                className="h-9 px-3 border border-[#e6e6e6] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Select Scope
// ---------------------------------------------------------------------------

function StepSelectScope({
  reportType,
  scopeMode,
  onScopeModeChange,
  locations,
  locationGroups,
  selectedGroupId,
  onGroupChange,
  selectedLocationIds,
  onLocationIdsChange,
  selectedJurisdiction,
  onJurisdictionChange,
}: {
  reportType: ReportType;
  scopeMode: "all" | "group" | "individual" | "jurisdiction";
  onScopeModeChange: (m: "all" | "group" | "individual" | "jurisdiction") => void;
  locations: Location[];
  locationGroups: LocationGroup[];
  selectedGroupId: string;
  onGroupChange: (v: string) => void;
  selectedLocationIds: string[];
  onLocationIdsChange: (ids: string[]) => void;
  selectedJurisdiction: string;
  onJurisdictionChange: (v: string) => void;
}) {
  const toggleLocation = (id: string) => {
    onLocationIdsChange(
      selectedLocationIds.includes(id)
        ? selectedLocationIds.filter((x) => x !== id)
        : [...selectedLocationIds, id],
    );
  };

  if (reportType === "sales_tax") {
    return (
      <div>
        <h2 className="text-base font-medium text-[#1a1a1a] mb-1">
          Select Jurisdiction
        </h2>
        <p className="text-sm text-[#878787] mb-4">
          Choose to report all jurisdictions or a specific one.
        </p>
        <div className="space-y-3">
          <ScopeOption
            label="All Jurisdictions"
            description="Include all tax jurisdictions in the report."
            selected={scopeMode === "all"}
            onClick={() => onScopeModeChange("all")}
          />
          <ScopeOption
            label="Specific Jurisdiction"
            description="Filter to a single jurisdiction."
            selected={scopeMode === "jurisdiction"}
            onClick={() => onScopeModeChange("jurisdiction")}
          />
          {scopeMode === "jurisdiction" && (
            <div className="pl-7 pt-2">
              <input
                type="text"
                placeholder="e.g. CA, NY, TX..."
                value={selectedJurisdiction}
                onChange={(e) => onJurisdictionChange(e.target.value)}
                className="h-9 w-full max-w-xs px-3 border border-[#e6e6e6] text-sm text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (reportType === "profitability") {
    return (
      <div>
        <h2 className="text-base font-medium text-[#1a1a1a] mb-1">
          Select Scope
        </h2>
        <p className="text-sm text-[#878787] mb-4">
          Choose the level of detail for profitability analysis.
        </p>
        <div className="space-y-3">
          <ScopeOption
            label="Business Level"
            description="Overall business profitability for the period."
            selected={scopeMode === "all"}
            onClick={() => onScopeModeChange("all")}
          />
          <ScopeOption
            label="Route Level"
            description="Break down profitability by route."
            selected={scopeMode === "individual"}
            onClick={() => onScopeModeChange("individual")}
          />
        </div>
      </div>
    );
  }

  // Rev share and employee productivity
  return (
    <div>
      <h2 className="text-base font-medium text-[#1a1a1a] mb-1">
        Select Scope
      </h2>
      <p className="text-sm text-[#878787] mb-4">
        {reportType === "rev_share"
          ? "Choose which locations to include in the revenue share calculation."
          : "Choose scope for the productivity report."}
      </p>
      <div className="space-y-3">
        <ScopeOption
          label="All Locations"
          description="Include all active locations with revenue share agreements."
          selected={scopeMode === "all"}
          onClick={() => onScopeModeChange("all")}
        />

        {locationGroups.length > 0 && (
          <>
            <ScopeOption
              label="Location Group"
              description="Select a group of locations (e.g. a property manager's portfolio)."
              selected={scopeMode === "group"}
              onClick={() => onScopeModeChange("group")}
            />
            {scopeMode === "group" && (
              <div className="pl-7 pt-2">
                <div className="relative">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => onGroupChange(e.target.value)}
                    className="h-9 w-full max-w-xs px-3 pr-8 border border-[#e6e6e6] text-sm text-[#1a1a1a] bg-white appearance-none focus:outline-none focus:border-[#1a1a1a]"
                  >
                    <option value="">Select a group...</option>
                    {locationGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#878787] pointer-events-none"
                  />
                </div>
              </div>
            )}
          </>
        )}

        <ScopeOption
          label="Individual Locations"
          description="Pick specific locations to include."
          selected={scopeMode === "individual"}
          onClick={() => onScopeModeChange("individual")}
        />
        {scopeMode === "individual" && (
          <div className="pl-7 pt-2 max-h-48 overflow-y-auto space-y-1">
            {locations.map((loc) => (
              <label
                key={loc.id}
                className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#fafafa] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedLocationIds.includes(loc.id)}
                  onChange={() => toggleLocation(loc.id)}
                  className="w-3.5 h-3.5 accent-[#1a1a1a]"
                />
                <span className="text-sm text-[#1a1a1a]">{loc.name}</span>
                {Number(loc.rev_share_pct ?? 0) > 0 && (
                  <span className="text-xs text-[#878787] ml-auto">
                    {loc.rev_share_pct}%
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScopeOption({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 border transition-colors ${
        selected
          ? "border-[#1a1a1a] bg-[#fafafa]"
          : "border-[#e6e6e6] hover:border-[#ccc]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
            selected ? "border-[#1a1a1a]" : "border-[#ccc]"
          }`}
        >
          {selected && (
            <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-[#1a1a1a]">{label}</p>
          <p className="text-xs text-[#878787] mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Preview
// ---------------------------------------------------------------------------

function StepPreview({
  loading,
  reportType,
  revShareData,
  salesTaxData,
  periodLabel,
}: {
  loading: boolean;
  reportType: ReportType;
  revShareData: {
    lineItems: RevenueShareLineItem[];
    totalGrossRevenue: number;
    totalCommission: number;
    periodLabel: string;
  } | null;
  salesTaxData: {
    lineItems: SalesTaxLineItem[];
    totalTaxableAmount: number;
    totalTaxAmount: number;
    periodLabel: string;
  } | null;
  periodLabel: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[#878787] mb-3" />
        <p className="text-sm text-[#878787]">Calculating report data...</p>
      </div>
    );
  }

  if (reportType === "rev_share" && revShareData) {
    return (
      <div>
        <h2 className="text-base font-medium text-[#1a1a1a] mb-1">
          Report Preview
        </h2>
        <p className="text-sm text-[#878787] mb-4">
          Review the calculated numbers before generating.
        </p>
        <RevenueSharePreviewTable
          lineItems={revShareData.lineItems}
          totalGrossRevenue={revShareData.totalGrossRevenue}
          totalCommission={revShareData.totalCommission}
          periodLabel={revShareData.periodLabel}
        />
      </div>
    );
  }

  if (reportType === "sales_tax" && salesTaxData) {
    return (
      <div>
        <h2 className="text-base font-medium text-[#1a1a1a] mb-1">
          Report Preview
        </h2>
        <p className="text-sm text-[#878787] mb-4">
          Review the tax summary before generating.
        </p>
        <SalesTaxPreviewTable
          lineItems={salesTaxData.lineItems}
          totalTaxableAmount={salesTaxData.totalTaxableAmount}
          totalTaxAmount={salesTaxData.totalTaxAmount}
          periodLabel={salesTaxData.periodLabel}
        />
      </div>
    );
  }

  if (
    reportType === "profitability" ||
    reportType === "employee_productivity"
  ) {
    return (
      <div>
        <h2 className="text-base font-medium text-[#1a1a1a] mb-1">
          Report Preview
        </h2>
        <p className="text-sm text-[#878787] mb-4">
          {reportType === "profitability"
            ? "Profitability report will be calculated from transaction data."
            : "Productivity report will be calculated from operator weekly plans."}
        </p>
        <div className="border border-[#e6e6e6] p-8 text-center">
          <p className="text-sm text-[#878787]">
            Preview for {periodLabel}
          </p>
          <p className="text-xs text-[#ccc] mt-1">
            Detailed data will be populated from your transaction and operations
            records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-sm text-[#878787]">
        No data available for the selected period and scope.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Email Draft
// ---------------------------------------------------------------------------

function StepEmailDraft({
  emailTo,
  onEmailToChange,
  emailSubject,
  onEmailSubjectChange,
  emailBody,
  onEmailBodyChange,
}: {
  emailTo: string;
  onEmailToChange: (v: string) => void;
  emailSubject: string;
  onEmailSubjectChange: (v: string) => void;
  emailBody: string;
  onEmailBodyChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-base font-medium text-[#1a1a1a] mb-1">
        Email Draft
      </h2>
      <p className="text-sm text-[#878787] mb-4">
        Pre-populate an email to send along with this report. You can edit or
        skip this step.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#878787] mb-1">
            To
          </label>
          <input
            type="email"
            value={emailTo}
            onChange={(e) => onEmailToChange(e.target.value)}
            placeholder="recipient@example.com"
            className="h-9 w-full px-3 border border-[#e6e6e6] text-sm text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#1a1a1a]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#878787] mb-1">
            Subject
          </label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => onEmailSubjectChange(e.target.value)}
            className="h-9 w-full px-3 border border-[#e6e6e6] text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#878787] mb-1">
            Body
          </label>
          <textarea
            value={emailBody}
            onChange={(e) => onEmailBodyChange(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-[#e6e6e6] text-sm text-[#1a1a1a] resize-none focus:outline-none focus:border-[#1a1a1a]"
          />
        </div>
      </div>
    </div>
  );
}
