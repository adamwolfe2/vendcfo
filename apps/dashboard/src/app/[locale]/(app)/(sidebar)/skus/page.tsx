import { SkusPage } from "@/components/operations/skus-page";
import { getServerCaller } from "@/trpc/server";
import { db } from "@vendcfo/db/client";
import { skus } from "@vendcfo/db/schema/vending";
import { eq } from "drizzle-orm";
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
    initialData = await db
      .select()
      .from(skus)
      .where(eq(skus.business_id, teamId!))
      .orderBy(skus.name);
  } catch {
    // Table may not exist yet -- render empty
  }

  return <SkusPage initialData={initialData} teamId={teamId!} />;
}
