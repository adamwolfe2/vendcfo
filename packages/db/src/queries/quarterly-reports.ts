import type { Database } from "@db/client";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  generatedReports,
  locationGroupMembers,
  locationGroups,
  revenueRecords,
  revShareAgreements,
  salesTaxRecords,
} from "../schema/reporting";
import { locations } from "../schema/vending";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevenueShareLineItem {
  locationId: string;
  locationName: string;
  grossRevenue: number;
  processingFees: number;
  netDeposited: number;
  sharePercentage: number;
  commissionAmount: number;
}

export interface RevenueShareReportData {
  lineItems: RevenueShareLineItem[];
  totalGrossRevenue: number;
  totalProcessingFees: number;
  totalNetDeposited: number;
  totalCommission: number;
  periodLabel: string;
}

export interface SalesTaxLineItem {
  jurisdiction: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface SalesTaxReportData {
  lineItems: SalesTaxLineItem[];
  totalTaxableAmount: number;
  totalTaxAmount: number;
  periodLabel: string;
}

export interface GeneratedReportRow {
  id: string;
  business_id: string;
  report_type: string;
  title: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: Date;
  email_to: string | null;
  email_sent_at: Date | null;
}

// ---------------------------------------------------------------------------
// List generated reports
// ---------------------------------------------------------------------------

export async function getGeneratedReports(
  db: Database,
  teamId: string,
): Promise<GeneratedReportRow[]> {
  const rows = await db
    .select({
      id: generatedReports.id,
      business_id: generatedReports.business_id,
      report_type: generatedReports.report_type,
      title: generatedReports.title,
      period_start: generatedReports.period_start,
      period_end: generatedReports.period_end,
      status: generatedReports.status,
      created_at: generatedReports.created_at,
      email_to: generatedReports.email_to,
      email_sent_at: generatedReports.email_sent_at,
    })
    .from(generatedReports)
    .where(eq(generatedReports.business_id, teamId))
    .orderBy(desc(generatedReports.created_at));

  return rows;
}

// ---------------------------------------------------------------------------
// Get single report with full data
// ---------------------------------------------------------------------------

export async function getGeneratedReportById(
  db: Database,
  reportId: string,
  teamId: string,
) {
  const [row] = await db
    .select()
    .from(generatedReports)
    .where(
      and(
        eq(generatedReports.id, reportId),
        eq(generatedReports.business_id, teamId),
      ),
    )
    .limit(1);

  return row ?? null;
}

// ---------------------------------------------------------------------------
// Revenue Share Calculator
// ---------------------------------------------------------------------------

export async function calculateRevenueShareReport(
  db: Database,
  params: {
    teamId: string;
    periodStart: string;
    periodEnd: string;
    locationIds?: string[];
    locationGroupId?: string;
  },
): Promise<RevenueShareReportData> {
  let targetLocationIds = params.locationIds ?? [];

  // If a location group is specified, resolve its members
  if (params.locationGroupId && targetLocationIds.length === 0) {
    const members = await db
      .select({ location_id: locationGroupMembers.location_id })
      .from(locationGroupMembers)
      .where(eq(locationGroupMembers.group_id, params.locationGroupId));

    targetLocationIds = members.map((m) => m.location_id);
  }

  // Fetch revenue records for the period
  const revenueConditions = [
    eq(revenueRecords.business_id, params.teamId),
    gte(revenueRecords.period_start, params.periodStart),
    lte(revenueRecords.period_end, params.periodEnd),
  ];

  if (targetLocationIds.length > 0) {
    revenueConditions.push(
      inArray(revenueRecords.location_id, targetLocationIds),
    );
  }

  const revenueRows = await db
    .select({
      location_id: revenueRecords.location_id,
      gross_revenue: sql<string>`sum(${revenueRecords.gross_revenue})`,
      processing_fees: sql<string>`sum(${revenueRecords.processing_fees})`,
      net_deposited: sql<string>`sum(${revenueRecords.net_deposited})`,
    })
    .from(revenueRecords)
    .where(and(...revenueConditions))
    .groupBy(revenueRecords.location_id);

  // Fetch location names and rev share agreements
  const locationIdsFromRevenue = revenueRows.map((r) => r.location_id);

  if (locationIdsFromRevenue.length === 0) {
    // No revenue data -- fall back to location-level rev_share_pct
    const locConditions = [
      eq(locations.business_id, params.teamId),
      eq(locations.is_active, true),
    ];
    if (targetLocationIds.length > 0) {
      locConditions.push(inArray(locations.id, targetLocationIds));
    }

    const locs = await db
      .select({
        id: locations.id,
        name: locations.name,
        rev_share_pct: locations.rev_share_pct,
      })
      .from(locations)
      .where(and(...locConditions));

    const lineItems: RevenueShareLineItem[] = locs.map((loc) => ({
      locationId: loc.id,
      locationName: loc.name,
      grossRevenue: 0,
      processingFees: 0,
      netDeposited: 0,
      sharePercentage: Number(loc.rev_share_pct ?? 0),
      commissionAmount: 0,
    }));

    return {
      lineItems,
      totalGrossRevenue: 0,
      totalProcessingFees: 0,
      totalNetDeposited: 0,
      totalCommission: 0,
      periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    };
  }

  const locRows = await db
    .select({
      id: locations.id,
      name: locations.name,
      rev_share_pct: locations.rev_share_pct,
    })
    .from(locations)
    .where(inArray(locations.id, locationIdsFromRevenue));

  const locationMap = new Map(locRows.map((l) => [l.id, l]));

  // Also fetch rev_share_agreements for more specific rates
  const agreements = await db
    .select({
      location_id: revShareAgreements.location_id,
      share_percentage: revShareAgreements.share_percentage,
    })
    .from(revShareAgreements)
    .where(
      and(
        eq(revShareAgreements.business_id, params.teamId),
        eq(revShareAgreements.is_active, true),
        inArray(revShareAgreements.location_id, locationIdsFromRevenue),
      ),
    );

  const agreementMap = new Map(
    agreements.map((a) => [a.location_id, Number(a.share_percentage)]),
  );

  const lineItems: RevenueShareLineItem[] = revenueRows.map((row) => {
    const loc = locationMap.get(row.location_id);
    const grossRevenue = Number(row.gross_revenue ?? 0);
    const processingFees = Number(row.processing_fees ?? 0);
    const netDeposited = Number(row.net_deposited ?? 0);

    // Prefer agreement percentage, fall back to location-level rev_share_pct
    const sharePercentage =
      agreementMap.get(row.location_id) ??
      Number(loc?.rev_share_pct ?? 0);

    const commissionAmount = (grossRevenue * sharePercentage) / 100;

    return {
      locationId: row.location_id,
      locationName: loc?.name ?? "Unknown Location",
      grossRevenue,
      processingFees,
      netDeposited,
      sharePercentage,
      commissionAmount,
    };
  });

  const totalGrossRevenue = lineItems.reduce(
    (s, i) => s + i.grossRevenue,
    0,
  );
  const totalProcessingFees = lineItems.reduce(
    (s, i) => s + i.processingFees,
    0,
  );
  const totalNetDeposited = lineItems.reduce(
    (s, i) => s + i.netDeposited,
    0,
  );
  const totalCommission = lineItems.reduce(
    (s, i) => s + i.commissionAmount,
    0,
  );

  return {
    lineItems,
    totalGrossRevenue,
    totalProcessingFees,
    totalNetDeposited,
    totalCommission,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
  };
}

// ---------------------------------------------------------------------------
// Sales Tax Calculator
// ---------------------------------------------------------------------------

export async function calculateSalesTaxReport(
  db: Database,
  params: {
    teamId: string;
    periodStart: string;
    periodEnd: string;
    jurisdiction?: string;
  },
): Promise<SalesTaxReportData> {
  const conditions = [
    eq(salesTaxRecords.business_id, params.teamId),
    gte(salesTaxRecords.period_start, params.periodStart),
    lte(salesTaxRecords.period_end, params.periodEnd),
  ];

  if (params.jurisdiction) {
    conditions.push(eq(salesTaxRecords.jurisdiction, params.jurisdiction));
  }

  const rows = await db
    .select({
      jurisdiction: salesTaxRecords.jurisdiction,
      tax_rate: sql<string>`avg(${salesTaxRecords.tax_rate})`,
      taxable_amount: sql<string>`sum(${salesTaxRecords.taxable_amount})`,
      tax_amount: sql<string>`sum(${salesTaxRecords.tax_amount})`,
    })
    .from(salesTaxRecords)
    .where(and(...conditions))
    .groupBy(salesTaxRecords.jurisdiction);

  const lineItems: SalesTaxLineItem[] = rows.map((row) => ({
    jurisdiction: row.jurisdiction,
    taxRate: Number(row.tax_rate ?? 0),
    taxableAmount: Number(row.taxable_amount ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
  }));

  const totalTaxableAmount = lineItems.reduce(
    (s, i) => s + i.taxableAmount,
    0,
  );
  const totalTaxAmount = lineItems.reduce((s, i) => s + i.taxAmount, 0);

  return {
    lineItems,
    totalTaxableAmount,
    totalTaxAmount,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
  };
}

// ---------------------------------------------------------------------------
// Create a generated report record
// ---------------------------------------------------------------------------

export async function createGeneratedReport(
  db: Database,
  params: {
    businessId: string;
    reportType: string;
    title: string;
    periodStart: string;
    periodEnd: string;
    locationGroupId?: string;
    employeeId?: string;
    reportData: Record<string, unknown>;
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
    status?: string;
    createdBy?: string;
  },
) {
  const [row] = await db
    .insert(generatedReports)
    .values({
      business_id: params.businessId,
      report_type: params.reportType,
      title: params.title,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      location_group_id: params.locationGroupId ?? null,
      employee_id: params.employeeId ?? null,
      report_data: params.reportData,
      email_to: params.emailTo ?? null,
      email_subject: params.emailSubject ?? null,
      email_body: params.emailBody ?? null,
      status: params.status ?? "generated",
      created_by: params.createdBy ?? null,
    })
    .returning();

  return row;
}

// ---------------------------------------------------------------------------
// Update report status
// ---------------------------------------------------------------------------

export async function updateReportStatus(
  db: Database,
  reportId: string,
  teamId: string,
  status: string,
  emailSentAt?: Date,
) {
  const updates: Record<string, unknown> = { status };
  if (emailSentAt) {
    updates.email_sent_at = emailSentAt;
  }

  await db
    .update(generatedReports)
    .set(updates)
    .where(
      and(
        eq(generatedReports.id, reportId),
        eq(generatedReports.business_id, teamId),
      ),
    );
}

// ---------------------------------------------------------------------------
// Fetch location groups for a team
// ---------------------------------------------------------------------------

export async function getLocationGroups(db: Database, teamId: string) {
  return db
    .select()
    .from(locationGroups)
    .where(eq(locationGroups.business_id, teamId))
    .orderBy(locationGroups.name);
}

// ---------------------------------------------------------------------------
// Fetch locations for a team
// ---------------------------------------------------------------------------

export async function getLocationsForReports(db: Database, teamId: string) {
  return db
    .select({
      id: locations.id,
      name: locations.name,
      rev_share_pct: locations.rev_share_pct,
      contact_name: locations.contact_name,
      contact_email: locations.contact_email,
    })
    .from(locations)
    .where(and(eq(locations.business_id, teamId), eq(locations.is_active, true)))
    .orderBy(locations.name);
}

// ---------------------------------------------------------------------------
// Fetch distinct jurisdictions
// ---------------------------------------------------------------------------

export async function getJurisdictions(db: Database, teamId: string) {
  const rows = await db
    .selectDistinct({ jurisdiction: salesTaxRecords.jurisdiction })
    .from(salesTaxRecords)
    .where(eq(salesTaxRecords.business_id, teamId))
    .orderBy(salesTaxRecords.jurisdiction);

  return rows.map((r) => r.jurisdiction);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPeriodLabel(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();
  const year = endDate.getFullYear();

  // Detect quarterly period
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
