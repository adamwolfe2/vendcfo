import { getSession } from "@vendcfo/supabase/cached-queries";
import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface SendEmailBody {
  reportId: string;
}

export async function POST(req: NextRequest) {
  try {
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

    const body: SendEmailBody = await req.json().catch(() => ({
      reportId: "",
    }));

    if (!body.reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400 },
      );
    }

    // Fetch the report
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

    if (!report.email_to) {
      return NextResponse.json(
        { error: "No email recipient configured for this report" },
        { status: 400 },
      );
    }

    // Build email HTML from report data
    const emailHtml = buildReportEmailHtml(report);

    // Send via Resend
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      // Mark as sent even without Resend -- for development
      await supabase
        .from("generated_reports")
        .update({
          status: "sent",
          email_sent_at: new Date().toISOString(),
        })
        .eq("id", report.id);

      return NextResponse.json({
        sent: true,
        message: "Report marked as sent (no email provider configured)",
      });
    }

    // Generate PDF attachment for rev_share reports
    let pdfAttachment: { filename: string; content: string } | undefined;

    if (report.report_type === "rev_share") {
      try {
        const { renderToBuffer } = await import("@react-pdf/renderer");
        const { CommissionReportPdf } = await import(
          "@/components/reports/commission-report-pdf"
        );
        const reportData = (report.report_data ?? {}) as Record<
          string,
          unknown
        >;

        // Fetch team name
        const { data: team } = await supabase
          .from("teams")
          .select("name")
          .eq("id", teamId)
          .single();

        const periodLabel =
          String(reportData.periodLabel ?? "") ||
          derivePeriodLabel(report.period_start, report.period_end);

        // @ts-expect-error — react-pdf renderer types diverge from React.ReactElement
        const pdfBuffer = await renderToBuffer(
          CommissionReportPdf({
            lineItems: (reportData.lineItems ?? []) as Array<{
              locationId: string;
              locationName: string;
              grossRevenue: number;
              processingFees: number;
              netDeposited: number;
              sharePercentage: number;
              commissionAmount: number;
            }>,
            totalGrossRevenue: Number(reportData.totalGrossRevenue ?? 0),
            totalCommission: Number(reportData.totalCommission ?? 0),
            periodLabel,
            generatedAt: new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            businessName: team?.name ?? "",
            contactEmail: report.email_to ?? undefined,
          }),
        );

        pdfAttachment = {
          filename: `Revenue-Share-Report-${periodLabel.replace(/\s+/g, "-")}.pdf`,
          content: Buffer.from(pdfBuffer).toString("base64"),
        };
      } catch {
        // PDF generation failed — send email without attachment
      }
    }

    const emailPayload: Record<string, unknown> = {
      from: "VendCFO <reports@vendcfo.ai>",
      to: [report.email_to],
      subject: report.email_subject ?? report.title,
      html: emailHtml,
    };

    if (pdfAttachment) {
      emailPayload.attachments = [pdfAttachment];
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!emailResponse.ok) {
      const errBody = await emailResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: (errBody as Record<string, unknown>).message ?? "Unknown error",
        },
        { status: 500 },
      );
    }

    // Update report status
    await supabase
      .from("generated_reports")
      .update({
        status: "sent",
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    return NextResponse.json({ sent: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Period label helper
// ---------------------------------------------------------------------------

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

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  });
  return `${dateFmt.format(startDate)} - ${dateFmt.format(endDate)}`;
}

// ---------------------------------------------------------------------------
// Email HTML builder
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function buildReportEmailHtml(report: Record<string, unknown>): string {
  const title = String(report.title ?? "Report");
  const body = String(report.email_body ?? "");
  const reportData = (report.report_data ?? {}) as Record<string, unknown>;
  const periodLabel = String(reportData.periodLabel ?? "");
  const reportType = String(report.report_type ?? "");

  let dataTableHtml = "";

  if (reportType === "rev_share" && Array.isArray(reportData.lineItems)) {
    const lineItems = reportData.lineItems as Array<Record<string, unknown>>;
    const rows = lineItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px 16px; font-size: 13px; color: #111; border-bottom: 1px solid #f0f0f0;">${item.locationName}</td>
        <td style="padding: 10px 16px; font-size: 13px; color: #111; text-align: right; border-bottom: 1px solid #f0f0f0;">${fmt(Number(item.grossRevenue ?? 0))}</td>
        <td style="padding: 10px 16px; font-size: 13px; color: #666; text-align: right; border-bottom: 1px solid #f0f0f0;">${Number(item.sharePercentage ?? 0).toFixed(1)}%</td>
        <td style="padding: 10px 16px; font-size: 13px; color: #111; text-align: right; font-weight: 600; border-bottom: 1px solid #f0f0f0;">${fmt(Number(item.commissionAmount ?? 0))}</td>
      </tr>`,
      )
      .join("");

    dataTableHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px 16px; font-size: 11px; font-weight: 600; color: #666; border-bottom: 1px solid #e0e0e0;">Location</td>
          <td style="padding: 10px 16px; font-size: 11px; font-weight: 600; color: #666; text-align: right; border-bottom: 1px solid #e0e0e0;">Gross Revenue</td>
          <td style="padding: 10px 16px; font-size: 11px; font-weight: 600; color: #666; text-align: right; border-bottom: 1px solid #e0e0e0;">Share %</td>
          <td style="padding: 10px 16px; font-size: 11px; font-weight: 600; color: #666; text-align: right; border-bottom: 1px solid #e0e0e0;">Commission</td>
        </tr>
        ${rows}
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #111;">Total</td>
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #111; text-align: right;">${fmt(Number(reportData.totalGrossRevenue ?? 0))}</td>
          <td style="padding: 12px 16px;"></td>
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #111; text-align: right;">${fmt(Number(reportData.totalCommission ?? 0))}</td>
        </tr>
      </table>`;
  } else if (
    reportType === "sales_tax" &&
    Array.isArray(reportData.lineItems)
  ) {
    const lineItems = reportData.lineItems as Array<Record<string, unknown>>;
    const rows = lineItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px 16px; font-size: 13px; color: #111; border-bottom: 1px solid #f0f0f0;">${item.jurisdiction}</td>
        <td style="padding: 10px 16px; font-size: 13px; color: #666; text-align: right; border-bottom: 1px solid #f0f0f0;">${(Number(item.taxRate ?? 0) * 100).toFixed(2)}%</td>
        <td style="padding: 10px 16px; font-size: 13px; color: #111; text-align: right; border-bottom: 1px solid #f0f0f0;">${fmt(Number(item.taxableAmount ?? 0))}</td>
        <td style="padding: 10px 16px; font-size: 13px; color: #111; text-align: right; font-weight: 600; border-bottom: 1px solid #f0f0f0;">${fmt(Number(item.taxAmount ?? 0))}</td>
      </tr>`,
      )
      .join("");

    dataTableHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px 16px; font-size: 11px; font-weight: 600; color: #666; border-bottom: 1px solid #e0e0e0;">Jurisdiction</td>
          <td style="padding: 10px 16px; font-size: 11px; font-weight: 600; color: #666; text-align: right; border-bottom: 1px solid #e0e0e0;">Tax Rate</td>
          <td style="padding: 10px 16px; font-size: 11px; font-weight: 600; color: #666; text-align: right; border-bottom: 1px solid #e0e0e0;">Taxable Amount</td>
          <td style="padding: 10px 16px; font-size: 11px; font-weight: 600; color: #666; text-align: right; border-bottom: 1px solid #e0e0e0;">Tax Collected</td>
        </tr>
        ${rows}
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #111;">Total</td>
          <td style="padding: 12px 16px;"></td>
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #111; text-align: right;">${fmt(Number(reportData.totalTaxableAmount ?? 0))}</td>
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #111; text-align: right;">${fmt(Number(reportData.totalTaxAmount ?? 0))}</td>
        </tr>
      </table>`;
  }

  const bodyHtml = body.replace(/\n/g, "<br />");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #111111; padding: 28px 32px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">VendCFO</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #999999;">${title}</p>
            </td>
          </tr>
          ${
            periodLabel
              ? `<tr>
            <td style="padding: 24px 32px 0;">
              <span style="font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Period</span>
              <br />
              <span style="font-size: 15px; font-weight: 600; color: #111;">${periodLabel}</span>
            </td>
          </tr>`
              : ""
          }
          ${
            bodyHtml
              ? `<tr>
            <td style="padding: 20px 32px;">
              <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6;">${bodyHtml}</p>
            </td>
          </tr>`
              : ""
          }
          ${
            dataTableHtml
              ? `<tr>
            <td style="padding: 0 32px 24px;">${dataTableHtml}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 20px 32px;">
              <hr style="border: none; border-top: 1px solid #e6e6e6; margin: 0 0 16px;" />
              <p style="margin: 0; font-size: 11px; color: #999; line-height: 1.5;">
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
