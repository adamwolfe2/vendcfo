import { createAdminClient } from "@api/services/supabase";
import type { ConversationInsight } from "./extract-insights";

/**
 * Retrieve stored conversation insights for a team.
 * Falls back to an empty array if the row doesn't exist yet.
 */
export async function getInsightsForTeam(
  teamId: string,
): Promise<ConversationInsight[]> {
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("user_ai_context")
      .select("conversation_insights")
      .eq("team_id", teamId)
      .single();
    return (data?.conversation_insights as ConversationInsight[]) || [];
  } catch {
    // Table may not exist yet or no row — return empty
    return [];
  }
}

/**
 * Persist conversation insights for a team (upsert).
 */
export async function saveInsights(
  teamId: string,
  insights: ConversationInsight[],
): Promise<void> {
  try {
    const supabase = await createAdminClient();
    await supabase.from("user_ai_context").upsert(
      {
        team_id: teamId,
        conversation_insights: insights,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id" },
    );
  } catch (err) {
    console.error("[insight-store] Failed to save insights:", err);
  }
}
