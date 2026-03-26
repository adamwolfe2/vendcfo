import { db } from "@vendcfo/db/client";
import { getWeeklyDigestData } from "@vendcfo/db/queries";
import { render } from "@vendcfo/email/render";
import WeeklyDigestEmail from "@vendcfo/email/emails/weekly-digest";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createElement } from "react";
import { format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

interface SendDigestBody {
  teamId?: string;
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

    const body: SendDigestBody = await req.json().catch(() => ({}));

    // Resolve teamId from body or from user membership
    let teamId = body.teamId;

    if (!teamId) {
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

      teamId = teamMembership.team_id;
    }

    // Get team details
    const { data: team } = await supabase
      .from("teams")
      .select("name, base_currency, email")
      .eq("id", teamId)
      .single();

    // Get team member emails to send to
    const { data: members } = await supabase
      .from("users_on_team")
      .select("user_id")
      .eq("team_id", teamId);

    if (!members || members.length === 0) {
      return NextResponse.json(
        { error: "No team members found" },
        { status: 400 },
      );
    }

    const memberIds = members.map((m) => m.user_id);

    const { data: userRecords } = await supabase
      .from("users")
      .select("email")
      .in("id", memberIds);

    const recipientEmails = (userRecords ?? [])
      .map((u) => u.email)
      .filter(Boolean) as string[];

    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { error: "No recipient emails found" },
        { status: 400 },
      );
    }

    // Aggregate digest data
    const digestData = await getWeeklyDigestData(db, teamId);

    const now = new Date();
    const weekStart = subDays(now, 7);
    const weekLabel = `${format(weekStart, "MMMM d")} - ${format(now, "MMMM d, yyyy")}`;

    // Render the email
    const emailHtml = await render(
      createElement(WeeklyDigestEmail, {
        teamName: team?.name ?? "Your Company",
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
        currency: team?.base_currency ?? "USD",
      }),
    );

    // Send via Resend
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json({
        sent: true,
        message: "Digest rendered successfully (no RESEND_API_KEY configured)",
        recipients: recipientEmails,
      });
    }

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
      return NextResponse.json(
        {
          error: "Failed to send digest email",
          details:
            (errBody as Record<string, unknown>).message ?? "Unknown error",
        },
        { status: 500 },
      );
    }

    const result = await emailResponse.json();

    return NextResponse.json({
      sent: true,
      resendId: (result as Record<string, unknown>).id ?? null,
      recipients: recipientEmails,
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
