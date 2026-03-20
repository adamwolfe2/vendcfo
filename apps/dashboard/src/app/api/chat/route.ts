import { db } from "@vendcfo/db/client";
import { users } from "@vendcfo/db/schema";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 0. Check for OPENAI_API_KEY early
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    // 1. Authenticate via Supabase session
    const {
      data: { session },
    } = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // 2. Get the user's teamId from the database
    const [user] = await db
      .select({ teamId: users.teamId })
      .from(users)
      .where(eq(users.id, userId));

    if (!user?.teamId) {
      return NextResponse.json(
        { success: false, error: "User has no team assigned" },
        { status: 400 },
      );
    }

    const teamId = user.teamId;

    // 3. Parse request body
    const body = await req.json();

    // 4. Lazy-import heavy AI dependencies to keep cold starts fast
    const [
      { chatRequestSchema },
      { mainAgent },
      { buildAppContext },
      { getUserContext },
      { buildBusinessContext },
      { smoothStream },
      { extractConversationInsights, deduplicateInsights },
      { getRelevantInsights, buildMemoryContext },
      { getInsightsForTeam, saveInsights },
    ] = await Promise.all([
      import("@vendcfo/api/schemas/chat") as any,
      import("@vendcfo/api/ai/agents/main") as any,
      import("@vendcfo/api/ai/agents/config/shared") as any,
      import("@vendcfo/api/ai/utils/get-user-context") as any,
      import("@vendcfo/api/ai/context/build-context") as any,
      import("ai"),
      import("@vendcfo/api/ai/memory/extract-insights") as any,
      import("@vendcfo/api/ai/memory/insight-relevance") as any,
      import("@vendcfo/api/ai/memory/insight-store") as any,
    ]);

    // 5. Validate request body
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 },
      );
    }

    const {
      message,
      id,
      timezone,
      agentChoice,
      toolChoice,
      country,
      city,
      metricsFilter,
    } = validationResult.data;

    // 6. Build user context (handles caching internally)
    const userContext = await getUserContext({
      db,
      userId,
      teamId,
      country,
      city,
      timezone,
    });

    // 6b. Build live business context for AI prompts
    const businessContext = await buildBusinessContext(teamId);

    // 7. Extract forced tool call from message metadata (widget clicks)
    let forcedToolCall:
      | { toolName: string; toolParams: Record<string, unknown> }
      | undefined;
    const metadata = (message as any)?.metadata;
    if (metadata?.toolCall?.toolName && metadata?.toolCall?.toolParams) {
      forcedToolCall = {
        toolName: metadata.toolCall.toolName,
        toolParams: metadata.toolCall.toolParams,
      };
    }

    // 8. Extract insights from user message and build memory context
    const existingInsights = await getInsightsForTeam(teamId);

    // Fire-and-forget: extract new insights from the user's message
    const extractionPromise = (async () => {
      try {
        const newInsights = await extractConversationInsights(
          message,
          "",
          existingInsights,
        );
        if (newInsights.length > 0) {
          const merged = deduplicateInsights(existingInsights, newInsights);
          await saveInsights(teamId, merged);
        }
      } catch (err) {
        console.error("[chat/route] Insight extraction failed:", err);
      }
    })();
    // Don't await — let it run in background
    void extractionPromise;

    // Score relevance and build memory context for this message
    const relevantInsights = getRelevantInsights(existingInsights, message);
    const memoryContext = buildMemoryContext(relevantInsights);

    // 9. Build app context and stream response
    const appContext = buildAppContext(userContext, id, {
      metricsFilter,
      forcedToolCall,
    });

    // Attach live business context so the agent can reference it
    (appContext as any).businessContext = businessContext;

    // Inject memory context from past conversations
    if (memoryContext) {
      (appContext as any).businessContext =
        ((appContext as any).businessContext || "") + memoryContext;
    }

    return mainAgent.toUIMessageStream({
      message,
      strategy: "auto",
      maxRounds: 5,
      maxSteps: 20,
      context: appContext,
      agentChoice,
      toolChoice,
      experimental_transform: smoothStream({
        chunking: "word",
      }),
      sendSources: true,
    });
  } catch (error) {
    console.error("[chat/route] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
