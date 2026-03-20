import { AlertsPageClient } from "@/components/alerts/alerts-page-client";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Alerts | VendCFO",
  description: "AI insights, profit leaks, and operational warnings.",
};

export default async function AlertsPage() {
  const caller = await getServerCaller();
  const user = await caller.user.me();

  if (!user?.teamId) {
    redirect("/teams");
  }

  return <AlertsPageClient teamId={user.teamId} />;
}
