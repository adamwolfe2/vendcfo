import { getSession } from "@vendcfo/supabase/cached-queries";
import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendReportBody {
  locationIds?: string[];
  period?: "monthly" | "quarterly";
  periodStart?: string;
  periodEnd?: string;
}

interface LocationData {
  id: string;
  name: string;
  business_id: string;
  address?: string | null;
  rev_share_pct: number;
  rev_share_contact_email: string | null;
  rev_share_contact_name: string | null;
  rev_share_payment_method: string | null;
  rev_share_payable_to: string | null;
  machine_count: number | null;
  status: string | null;
}

interface ReportDetail {
  locationId: string;
  locationName: string;
  email: string | null;
  status: "sent" | "skipped" | "failed";
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function getDefaultPeriod(period: "monthly" | "quarterly"): {
  start: string;
  end: string;
  label: string;
} {
  const now = new Date();

  if (period === "quarterly") {
    const quarter = Math.floor(now.getMonth() / 3);
    const startMonth = quarter * 3;
    const start = new Date(now.getFullYear(), startMonth, 1);
    const end = new Date(now.getFullYear(), startMonth + 3, 0);
    const quarterLabel = `Q${quarter + 1} ${now.getFullYear()}`;
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: quarterLabel,
    };
  }

  // Monthly
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthLabel = start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: monthLabel,
  };
}

function getMonthsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const months =
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth()) +
    1;
  return Math.max(1, months);
}

// ---------------------------------------------------------------------------
// Email HTML Generator
// ---------------------------------------------------------------------------

function generateEmailHtml(params: {
  locationName: string;
  address: string;
  periodLabel: string;
  grossRevenue: number;
  cogs: number;
  grossMarginPct: number;
  revSharePct: number;
  amountDue: number;
  paymentMethod: string;
  payableTo: string;
  contactName: string;
}): string {
  const {
    locationName,
    address,
    periodLabel,
    grossRevenue,
    cogs,
    grossMarginPct,
    revSharePct,
    amountDue,
    paymentMethod,
    payableTo,
    contactName,
  } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Revenue Share Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color: #111111; padding: 28px 32px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                VendCFO
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #999999;">
                Revenue Share Report
              </p>
            </td>
          </tr>

          <!-- Period & Location -->
          <tr>
            <td style="padding: 28px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 600; color: #888888; text-transform: uppercase; letter-spacing: 0.5px;">Period</span>
                    <br />
                    <span style="font-size: 15px; font-weight: 600; color: #111111;">${periodLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px;">
                    <span style="font-size: 11px; font-weight: 600; color: #888888; text-transform: uppercase; letter-spacing: 0.5px;">Location</span>
                    <br />
                    <span style="font-size: 15px; font-weight: 600; color: #111111;">${locationName}</span>
                  </td>
                </tr>
                ${
                  address
                    ? `<tr>
                  <td style="padding-bottom: 4px;">
                    <span style="font-size: 11px; font-weight: 600; color: #888888; text-transform: uppercase; letter-spacing: 0.5px;">Address</span>
                    <br />
                    <span style="font-size: 13px; color: #555555;">${address}</span>
                  </td>
                </tr>`
                    : ""
                }
                ${
                  contactName
                    ? `<tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 600; color: #888888; text-transform: uppercase; letter-spacing: 0.5px;">Attention</span>
                    <br />
                    <span style="font-size: 13px; color: #555555;">${contactName}</span>
                  </td>
                </tr>`
                    : ""
                }
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 20px 32px;">
              <hr style="border: none; border-top: 1px solid #e6e6e6; margin: 0;" />
            </td>
          </tr>

          <!-- Sales Performance Table -->
          <tr>
            <td style="padding: 0 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #333333; text-transform: uppercase; letter-spacing: 0.5px;">
                Sales Performance
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #666666; border-bottom: 1px solid #e0e0e0;">Metric</td>
                  <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #666666; text-align: right; border-bottom: 1px solid #e0e0e0;">Amount</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 14px; color: #111111; border-bottom: 1px solid #f0f0f0;">Gross Revenue</td>
                  <td style="padding: 12px 16px; font-size: 14px; color: #111111; text-align: right; font-weight: 500; border-bottom: 1px solid #f0f0f0;">${fmt(grossRevenue)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 14px; color: #991b1b; border-bottom: 1px solid #f0f0f0;">COGS</td>
                  <td style="padding: 12px 16px; font-size: 14px; color: #991b1b; text-align: right; font-weight: 500; border-bottom: 1px solid #f0f0f0;">(${fmt(cogs)})</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 14px; color: #555555; border-bottom: 1px solid #f0f0f0;">Gross Margin</td>
                  <td style="padding: 12px 16px; font-size: 14px; color: #555555; text-align: right; font-weight: 500; border-bottom: 1px solid #f0f0f0;">${grossMarginPct.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 14px; color: #555555; border-bottom: 1px solid #e0e0e0;">Revenue Share Rate</td>
                  <td style="padding: 12px 16px; font-size: 14px; color: #555555; text-align: right; font-weight: 500; border-bottom: 1px solid #e0e0e0;">${revSharePct.toFixed(1)}%</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 14px 16px; font-size: 15px; font-weight: 700; color: #111111;">Amount Due</td>
                  <td style="padding: 14px 16px; font-size: 15px; font-weight: 700; color: #111111; text-align: right;">${fmt(amountDue)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <h2 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #333333; text-transform: uppercase; letter-spacing: 0.5px;">
                Payment Details
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #888888; width: 140px;">Payment Method</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #111111; font-weight: 500;">${paymentMethod || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #888888; width: 140px;">Payable To</td>
                  <td style="padding: 4px 0; font-size: 13px; color: #111111; font-weight: 500;">${payableTo || "N/A"}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 32px;">
              <hr style="border: none; border-top: 1px solid #e6e6e6; margin: 0 0 16px;" />
              <p style="margin: 0; font-size: 11px; color: #999999; line-height: 1.5;">
                This report was automatically generated by VendCFO. Contact support@vendcfo.ai with questions.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const {
      data: { session },
    } = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's team
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

    // 2. Parse body
    const body: SendReportBody = await req.json().catch(() => ({}));
    const period = body.period ?? "quarterly";
    const periodInfo = body.periodStart && body.periodEnd
      ? {
          start: body.periodStart,
          end: body.periodEnd,
          label: `${new Date(body.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" })} - ${new Date(body.periodEnd).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
        }
      : getDefaultPeriod(period);

    const months = getMonthsBetween(periodInfo.start, periodInfo.end);

    // 3. Fetch locations
    let query = supabase
      .from("locations")
      .select("*")
      .eq("business_id", teamId)
      .neq("status", "inactive");

    if (body.locationIds && body.locationIds.length > 0) {
      query = query.in("id", body.locationIds);
    } else {
      query = query.gt("rev_share_pct", 0);
    }

    const { data: locations, error: locError } = await query;

    if (locError) {
      return NextResponse.json(
        { error: "Failed to fetch locations", details: locError.message },
        { status: 500 },
      );
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json(
        { sent: 0, failed: 0, details: [], message: "No eligible locations found" },
      );
    }

    // 4. Process each location
    const resendApiKey = process.env.RESEND_API_KEY;
    const details: ReportDetail[] = [];
    let sent = 0;
    let failed = 0;

    for (const loc of locations as LocationData[]) {
      const contactEmail = loc.rev_share_contact_email;

      if (!contactEmail) {
        details.push({
          locationId: loc.id,
          locationName: loc.name,
          email: null,
          status: "skipped",
          error: "No contact email configured",
        });
        continue;
      }

      // Calculate revenue using the same formula as the Revenue Share page
      const machines = loc.machine_count ?? 1;
      const revSharePct = loc.rev_share_pct ?? 0;
      const baseMonthlyRevenue = machines * 2500;
      const grossRevenue = baseMonthlyRevenue * months;
      const cogs = grossRevenue * 0.35;
      const grossMarginPct =
        grossRevenue > 0 ? ((grossRevenue - cogs) / grossRevenue) * 100 : 0;
      const revShareAmount = (grossRevenue * revSharePct) / 100;

      // Generate email HTML
      const emailHtml = generateEmailHtml({
        locationName: loc.name,
        address: loc.address ?? "",
        periodLabel: periodInfo.label,
        grossRevenue,
        cogs,
        grossMarginPct,
        revSharePct,
        amountDue: revShareAmount,
        paymentMethod: loc.rev_share_payment_method ?? "N/A",
        payableTo: loc.rev_share_payable_to ?? "N/A",
        contactName: loc.rev_share_contact_name ?? "",
      });

      const subject = `Revenue Share Report -- ${loc.name} -- ${periodInfo.label}`;

      // Send via Resend
      let resendId: string | null = null;

      if (resendApiKey) {
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "VendCFO <reports@vendcfo.ai>",
              to: [contactEmail],
              subject,
              html: emailHtml,
            }),
          });

          if (!emailResponse.ok) {
            const errBody = await emailResponse.json().catch(() => ({}));
            throw new Error(
              errBody.message || `Resend returned ${emailResponse.status}`,
            );
          }

          const emailResult = await emailResponse.json();
          resendId = emailResult.id ?? null;
        } catch (emailErr: unknown) {
          const errMsg =
            emailErr instanceof Error ? emailErr.message : "Unknown email error";
          details.push({
            locationId: loc.id,
            locationName: loc.name,
            email: contactEmail,
            status: "failed",
            error: errMsg,
          });
          failed++;
          continue;
        }
      } else {
        // No Resend API key -- still record the payment but note it wasn't emailed
        console.warn(
          "[revenue-share] RESEND_API_KEY not set. Skipping email send, recording payment only.",
        );
      }

      // Record the payment
      const { error: insertError } = await supabase
        .from("rev_share_payments")
        .insert({
          team_id: teamId,
          location_id: loc.id,
          period_start: periodInfo.start,
          period_end: periodInfo.end,
          gross_revenue: grossRevenue,
          cogs,
          rev_share_pct: revSharePct,
          rev_share_amount: revShareAmount,
          payment_method: loc.rev_share_payment_method ?? "check",
          payment_status: "pending",
          email_sent_at: resendId ? new Date().toISOString() : null,
          resend_id: resendId,
        });

      if (insertError) {
        console.error(
          `[revenue-share] Failed to record payment for ${loc.name}:`,
          insertError,
        );
      }

      details.push({
        locationId: loc.id,
        locationName: loc.name,
        email: contactEmail,
        status: "sent",
      });
      sent++;
    }

    return NextResponse.json({ sent, failed, details });
  } catch (error) {
    console.error("[revenue-share/send-report] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
