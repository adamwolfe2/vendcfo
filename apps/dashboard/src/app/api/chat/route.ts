import { anthropic } from "@ai-sdk/anthropic";
import { db } from "@vendcfo/db/client";
import { users } from "@vendcfo/db/schema";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { eq } from "drizzle-orm";
import { streamText, stepCountIs } from "ai";
import { buildSystemPrompt } from "./platform-knowledge";
import { createChatTools } from "./tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 },
      );
    }

    // 1. Auth
    const {
      data: { session },
    } = await getSession();

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get team ID
    const [user] = await db
      .select({ teamId: users.teamId })
      .from(users)
      .where(eq(users.id, session.user.id));

    if (!user?.teamId) {
      return Response.json(
        { error: "No team found" },
        { status: 400 },
      );
    }

    const teamId = user.teamId;

    // 3. Build business context
    let businessContext = "";
    try {
      const { buildBusinessContext } = await import(
        "@vendcfo/api/ai/context/build-context"
      );
      businessContext = await buildBusinessContext(teamId);
    } catch {
      businessContext = "Business context unavailable.";
    }

    // 4. Parse request body
    const body = await req.json();
    const { messages } = body;

    // 5. Build messages array for the AI SDK
    // The frontend sends messages via DefaultChatTransport with a custom
    // prepareSendMessagesRequest that includes the full messages array.
    const aiMessages = (messages || []).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("\n")
          : JSON.stringify(m.content),
    }));

    // 6. Stream with Claude via Vercel AI SDK
    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: buildSystemPrompt(businessContext),
      messages: aiMessages,
      tools: createChatTools(teamId),
      stopWhen: stepCountIs(5),
      maxOutputTokens: 4096,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[chat] Error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
