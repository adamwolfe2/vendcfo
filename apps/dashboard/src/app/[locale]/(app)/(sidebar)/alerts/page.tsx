import { AlertsPageClient } from "@/components/alerts/alerts-page-client";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Alerts | VendCFO",
  description: "AI insights, profit leaks, and operational warnings.",
};

export default async function AlertsPage() {
  let teamId: string | null = null;
  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
  } catch {
    redirect("/login");
  }

  return <AlertsPageClient teamId={teamId} />;
}
