import { CapacityDashboard } from "@/components/capacity/capacity-dashboard";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Capacity Planning | VendCFO",
  description:
    "Employee utilization, workload distribution, and hiring recommendations.",
};

export default async function CapacityPage() {
  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    return <CapacityDashboard teamId={user.teamId} />;
  } catch {
    redirect("/login");
  }
}
