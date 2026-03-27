"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { RevenueSharePreviewTable } from "./revenue-share-preview";
import { SalesTaxPreviewTable } from "./sales-tax-preview";
import { REPORT_TYPES } from "./wizard-constants";
import type {
  Location,
  LocationGroup,
  ReportType,
  RevenueShareLineItem,
  SalesTaxLineItem,
} from "./wizard-types";

// ---------------------------------------------------------------------------
// Step 1: Select Report Type
// ---------------------------------------------------------------------------

export function StepSelectType({
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

export function StepSelectPeriod({
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
// ScopeOption (shared)
// ---------------------------------------------------------------------------

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
// Step 3: Select Scope
// ---------------------------------------------------------------------------

export function StepSelectScope({
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

// ---------------------------------------------------------------------------
// Step 4: Preview
// ---------------------------------------------------------------------------

export function StepPreview({
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

export function StepEmailDraft({
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
