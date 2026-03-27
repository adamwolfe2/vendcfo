import { RevenueSharePage } from "@/components/revenue-share/revenue-share-page";
import { getServerCaller } from "@/trpc/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Revenue Share | VendCFO",
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

  return <RevenueSharePage teamId={teamId!} />;
}
