import { SkusPage } from "@/components/operations/skus-page";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Products & SKUs | VendCFO",
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

  let initialData: any[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("skus")
      .select("*")
      .eq("business_id", teamId)
      .order("name", { ascending: true });
    initialData = data || [];
  } catch {
    // Table may not exist yet — render empty
  }

  return <SkusPage initialData={initialData} teamId={teamId} />;
}
