import { getSession } from "@vendcfo/supabase/cached-queries";
import { createClient } from "@vendcfo/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CommissionReportPdf,
  type CommissionReportData,
  type RevenueShareLineItem,
} from "@/components/reports/commission-report-pdf";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Request body
// ---------------------------------------------------------------------------

interface GeneratePdfBody {
  reportId?: string;
  reportType?: string;
  periodStart?: string;
  periodEnd?: string;
  locationIds?: string[];
  teamId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGeneratedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function derivePeriodLabel(start: string, end: string): string {
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
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const {
      data: { session },
    } = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient() as any;

    // Resolve team
    const { data: teamMembership } = await supabase
      .from("users_on_team")
      .select("team_id")
      .eq("user_id", session.user.id)
      .limit(1)
      .single();

    if (!teamMembership?.team_id) {
      return NextResponse.json(
        { error: "No team found for user" },
        { status: 400 },
      );
    }

    const teamId = teamMembership.team_id;

    const body: GeneratePdfBody = await req.json().catch(() => ({}));

    // -----------------------------------------------------------------------
    // Path A: Generate from an existing saved report
    // -----------------------------------------------------------------------
    if (body.reportId) {
      const { data: report, error: fetchError } = await supabase
        .from("generated_reports")
        .select("*")
        .eq("id", body.reportId)
        .eq("business_id", teamId)
        .single();

      if (fetchError || !report) {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 },
        );
      }

      if (report.report_type !== "rev_share") {
        return NextResponse.json(
          { error: "PDF generation is currently supported for revenue share reports" },
          { status: 400 },
        );
      }

      const reportData = (report.report_data ?? {}) as Record<string, unknown>;

      // Fetch team name
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      const pdfData: CommissionReportData = {
        lineItems: (reportData.lineItems ?? []) as RevenueShareLineItem[],
        totalGrossRevenue: Number(reportData.totalGrossRevenue ?? 0),
        totalCommission: Number(reportData.totalCommission ?? 0),
        periodLabel: String(
          reportData.periodLabel ??
            derivePeriodLabel(report.period_start, report.period_end),
        ),
        generatedAt: formatGeneratedDate(),
        businessName: team?.name ?? "",
        contactName: report.email_to
          ? undefined
          : undefined,
        contactEmail: report.email_to ?? undefined,
      };

      const pdfBuffer = await renderToBuffer(CommissionReportPdf(pdfData) as any);

      const filename = `Revenue-Share-Report-${pdfData.periodLabel.replace(/\s+/g, "-")}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // -----------------------------------------------------------------------
    // Path B: Generate on-the-fly from parameters
    // -----------------------------------------------------------------------
    if (
      body.reportType === "rev_share" &&
      body.periodStart &&
      body.periodEnd
    ) {
      // Fetch revenue records
      let query = supabase
        .from("revenue_records")
        .select("location_id, gross_revenue, processing_fees, net_deposited")
        .eq("business_id", teamId)
        .gte("period_start", body.periodStart)
        .lte("period_end", body.periodEnd);

      if (body.locationIds && body.locationIds.length > 0) {
        query = query.in("location_id", body.locationIds);
      }

      const { data: revenueData } = await query;

      // Fetch locations with rev share percentages
      const { data: locationsRaw } = await supabase
        .from("locations")
        .select("id, name, rev_share_pct, contact_name, contact_email")
        .eq("business_id", teamId);

      const locations = locationsRaw ?? [];

      // Group revenue by location
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

      // Build line items
      const targetLocations =
        body.locationIds && body.locationIds.length > 0
          ? locations.filter((l: any) => body.locationIds?.includes(l.id))
          : locations;

      const lineItems: RevenueShareLineItem[] = targetLocations
        .filter((loc: any) => Number(loc.rev_share_pct ?? 0) > 0)
        .map((loc: any) => {
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

      // Fetch team name
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single();

      const contactLoc = targetLocations.find((l: any) => l.contact_email);
      const periodLabel = derivePeriodLabel(body.periodStart, body.periodEnd);

      const pdfData: CommissionReportData = {
        lineItems,
        totalGrossRevenue,
        totalCommission,
        periodLabel,
        generatedAt: formatGeneratedDate(),
        businessName: team?.name ?? "",
        contactName: contactLoc?.contact_name ?? undefined,
        contactEmail: contactLoc?.contact_email ?? undefined,
      };

      const pdfBuffer = await renderToBuffer(CommissionReportPdf(pdfData) as any);

      const filename = `Revenue-Share-Report-${periodLabel.replace(/\s+/g, "-")}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(
      {
        error:
          "Provide either a reportId, or reportType + periodStart + periodEnd",
      },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
