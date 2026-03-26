import { db } from "@vendcfo/db/client";
import { teams, usersOnTeam, users } from "@vendcfo/db/schema";
import { getWeeklyDigestData } from "@vendcfo/db/queries";
import { render } from "@vendcfo/email/render";
import WeeklyDigestEmail from "@vendcfo/email/emails/weekly-digest";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createElement } from "react";
import { eq } from "drizzle-orm";
import { format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY not configured" },
        { status: 500 },
      );
    }

    // Fetch all teams
    const activeTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        baseCurrency: teams.baseCurrency,
      })
      .from(teams);

    const now = new Date();
    const weekStart = subDays(now, 7);
    const weekLabel = `${format(weekStart, "MMMM d")} - ${format(now, "MMMM d, yyyy")}`;

    const results: Array<{
      teamId: string;
      teamName: string | null;
      status: "sent" | "skipped" | "failed";
      recipients?: string[];
      error?: string;
    }> = [];

    for (const team of activeTeams) {
      try {
        // Get team member emails
        const members = await db
          .select({ email: users.email })
          .from(usersOnTeam)
          .innerJoin(users, eq(usersOnTeam.userId, users.id))
          .where(eq(usersOnTeam.teamId, team.id));

        const recipientEmails = members
          .map((m) => m.email)
          .filter(Boolean) as string[];

        if (recipientEmails.length === 0) {
          results.push({
            teamId: team.id,
            teamName: team.name,
            status: "skipped",
            error: "No member emails",
          });
          continue;
        }

        // Aggregate digest data
        const digestData = await getWeeklyDigestData(db, team.id);

        // Render email
        const emailHtml = await render(
          createElement(WeeklyDigestEmail, {
            teamName: team.name ?? "Your Company",
            weekLabel,
            totalRevenue: digestData.totalRevenue,
            totalExpenses: digestData.totalExpenses,
            netIncome: digestData.netIncome,
            topLocations: digestData.topLocations.map((l) => ({
              locationName: l.locationName,
              revenue: l.revenue,
            })),
            bottomLocations: digestData.bottomLocations.map((l) => ({
              locationName: l.locationName,
              revenue: l.revenue,
            })),
            overdueInvoiceCount: digestData.overdueInvoices.count,
            overdueInvoiceAmount: digestData.overdueInvoices.totalAmount,
            upcomingServiceStops: digestData.upcomingServiceStops,
            capacityAlertCount: digestData.capacityAlertCount,
            newCustomerCount: digestData.newCustomerCount,
            currency: team.baseCurrency ?? "USD",
          }),
        );

        // Send via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "VendCFO <digest@vendcfo.ai>",
            to: recipientEmails,
            subject: `Weekly Digest - ${weekLabel}`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errBody = await emailResponse.json().catch(() => ({}));
          results.push({
            teamId: team.id,
            teamName: team.name,
            status: "failed",
            recipients: recipientEmails,
            error:
              (errBody as Record<string, unknown>).message?.toString() ??
              `Resend returned ${emailResponse.status}`,
          });
          continue;
        }

        results.push({
          teamId: team.id,
          teamName: team.name,
          status: "sent",
          recipients: recipientEmails,
        });
      } catch (teamError) {
        results.push({
          teamId: team.id,
          teamName: team.name,
          status: "failed",
          error:
            teamError instanceof Error
              ? teamError.message
              : "Unknown error",
        });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    return NextResponse.json({
      success: true,
      summary: { sent, failed, skipped, total: activeTeams.length },
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
