import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Finance Dashboard | VendCFO",
  description:
    "Revenue overview, location performance, route summary, and P&L.",
};

export default async function FinancePage() {
  const caller = await getServerCaller();
  const user = await caller.user.me();

  if (!user?.teamId) {
    redirect("/teams");
  }

  return <FinanceDashboard teamId={user.teamId} />;
}
