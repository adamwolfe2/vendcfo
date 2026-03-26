import { ProductivityDashboard } from "@/components/productivity/productivity-dashboard";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Operator Productivity | VendCFO",
  description:
    "Planned vs actual hours per operator, efficiency scores, and time tracking.",
};

export default async function ProductivityPage() {
  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    return <ProductivityDashboard teamId={user.teamId} />;
  } catch {
    redirect("/login");
  }
}
