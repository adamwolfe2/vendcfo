import { LocationPnlDashboard } from "@/components/analytics/location-pnl-dashboard";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Location P&L | VendCFO",
  description: "Per-location profitability analysis with revenue, costs, and margins.",
};

export default async function LocationPnlPage() {
  let teamId: string | null = null;
  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
  } catch {
    redirect("/login");
  }

  return <LocationPnlDashboard teamId={teamId} />;
}
