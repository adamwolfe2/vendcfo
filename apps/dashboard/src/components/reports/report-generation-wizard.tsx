"use client";

import { createClient } from "@vendcfo/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Download,
  Loader2,
  Send,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { REPORT_TYPES, getPreviousQuarter, fmt } from "./wizard-constants";
import {
  StepSelectType,
  StepSelectPeriod,
  StepSelectScope,
  StepPreview,
  StepEmailDraft,
} from "./wizard-steps";
import type {
  ReportType,
  WizardStep,
  RevenueShareLineItem,
  SalesTaxLineItem,
  WizardProps,
} from "./wizard-types";

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
}: WizardProps) {
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

