// ---------------------------------------------------------------------------
// Types for report generation wizard
// ---------------------------------------------------------------------------

export interface Location {
  id: string;
  name: string;
  rev_share_pct: number | null;
  contact_name: string | null;
  contact_email: string | null;
}

export interface LocationGroup {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
}

export interface RevenueShareLineItem {
  locationId: string;
  locationName: string;
  grossRevenue: number;
  processingFees: number;
  netDeposited: number;
  sharePercentage: number;
  commissionAmount: number;
}

export interface SalesTaxLineItem {
  jurisdiction: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
}

export type ReportType =
  | "rev_share"
  | "sales_tax"
  | "profitability"
  | "employee_productivity";

export type WizardStep = "type" | "period" | "scope" | "preview" | "email";

export interface WizardProps {
  teamId: string;
  teamName: string;
  userId: string;
  locations: Location[];
  locationGroups: LocationGroup[];
  onComplete: (report: Record<string, unknown>) => void;
  onCancel: () => void;
}
