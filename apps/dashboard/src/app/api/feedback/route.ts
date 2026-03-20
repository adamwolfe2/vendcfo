import { createClient } from "@vendcfo/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Validate required fields
  if (!body.messageId || !body.chatId || !body.type) {
    return NextResponse.json(
      { error: "Missing required fields: messageId, chatId, type" },
      { status: 400 },
    );
  }

  // Store feedback in response_feedback table if it exists,
  // otherwise this is a fallback that logs to console for debugging.
  // Primary feedback path is via TRPC chatFeedback.create which uses Redis cache.
  try {
    const { error } = await supabase.from("response_feedback").insert({
      message_id: body.messageId,
      conversation_id: body.chatId,
      user_id: user.id,
      agent_name: body.agentName || "unknown",
      tools_used: body.toolsUsed || [],
      rating: body.type === "positive" ? 1 : -1,
      reason: body.comment || null,
    });

    if (error) {
      // Table may not exist yet — that is okay, TRPC/Redis is the primary store
      console.warn("response_feedback insert failed (table may not exist):", error.message);
      return NextResponse.json({ success: true, fallback: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json({ success: true, fallback: true });
  }
}
