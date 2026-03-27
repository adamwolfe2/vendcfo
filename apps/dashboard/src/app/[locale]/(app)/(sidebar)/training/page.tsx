import { TrainingPage } from "@/components/training/training-page";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Training | VendCFO",
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

  let publicVideos: any[] = [];

  try {
    const supabase = await createClient() as any;
    const { data } = await supabase
      .from("training_videos")
      .select("*")
      .eq("is_public", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    publicVideos = data ?? [];
  } catch {
    // Table may not exist yet — render empty
  }

  return (
    <TrainingPage publicVideos={publicVideos} teamId={teamId!} />
  );
}
