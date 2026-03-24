import { ReportsPage } from "@/components/reports/reports-page";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reports | VendCFO",
};

export default async function Page() {
  let teamId: string | null = null;
  let userId: string | null = null;

  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
    userId = user.id;
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();

  const [reportsRes, locationsRes, groupsRes] = await Promise.all([
    supabase
      .from("generated_reports")
      .select("*")
      .eq("business_id", teamId)
      .order("created_at", { ascending: false }),
    supabase
      .from("locations")
      .select("id, name, rev_share_pct, contact_name, contact_email")
      .eq("business_id", teamId)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("location_groups")
      .select("id, name, contact_name, contact_email")
      .eq("business_id", teamId)
      .order("name"),
  ]);

  return (
    <ReportsPage
      teamId={teamId}
      userId={userId}
      initialReports={reportsRes.data ?? []}
      locations={locationsRes.data ?? []}
      locationGroups={groupsRes.data ?? []}
    />
  );
}
