import { TrainingPage } from "@/components/training/training-page";
import { getServerCaller } from "@/trpc/server";
import { createClient } from "@vendcfo/supabase/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Training | VendCFO",
};

export default async function Page() {
  const caller = await getServerCaller();
  const user = await caller.user.me();

  if (!user?.teamId) {
    redirect("/teams");
  }

  // Fetch public training videos server-side
  const supabase = await createClient();
  const { data: publicVideos } = await supabase
    .from("training_videos")
    .select("*")
    .eq("is_public", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <TrainingPage
      publicVideos={publicVideos ?? []}
      teamId={user.teamId}
    />
  );
}
