import { RoutesPage } from "@/components/operations/routes-page";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Routes | VendCFO",
};

export default async function Page() {
  let teamId: string | null = null;

  try {
    const caller = await getServerCaller();
    const user = await caller.user.me();
    if (!user?.teamId) redirect("/teams");
    teamId = user.teamId;
  } catch {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("routes")
    .select("*, locations(count)")
    .eq("business_id", teamId)
    .order("name", { ascending: true });

  return <RoutesPage initialData={data || []} teamId={teamId} />;
}
