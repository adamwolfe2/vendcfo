import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const insightSchema = z.object({
  insights: z.array(
    z.object({
      type: z.enum([
        "goal",
        "decision",
        "concern",
        "correction",
        "preference",
      ]),
      content: z.string(),
      entity: z.string().nullable(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

export interface ConversationInsight {
  type: "goal" | "decision" | "concern" | "correction" | "preference";
  content: string;
  entity: string | null;
  confidence: number;
  extracted_at: string;
}

export async function extractConversationInsights(
  userMessage: string,
  aiResponse: string,
  existingInsights: ConversationInsight[],
): Promise<ConversationInsight[]> {
  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      temperature: 0.1,
      schema: insightSchema,
      system: `You extract business-relevant insights from a vending operator's conversation with their AI CFO.

Extract ONLY if the user explicitly states or clearly implies:
- GOAL: A target ("I want to reach $600/machine", "planning to add 10 machines")
- DECISION: Something decided ("dropping Machine #12", "switching to cashless")
- CONCERN: A recurring worry ("labor costs keep going up", "worried about summer")
- CORRECTION: They corrected the AI ("those are gym locations, not schools")
- PREFERENCE: How they want to interact ("just give me the numbers")

Do NOT extract generic questions or information the AI told them.
Return empty array [] if nothing qualifies.

EXISTING INSIGHTS (avoid duplicates):
${JSON.stringify(existingInsights.slice(-20))}`,
      prompt: `USER: ${userMessage}\n\nAI RESPONSE: ${aiResponse.substring(0, 500)}`,
    });

    return result.object.insights.map((i) => ({
      ...i,
      extracted_at: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export function deduplicateInsights(
  existing: ConversationInsight[],
  newInsights: ConversationInsight[],
): ConversationInsight[] {
  const merged = [...existing];

  for (const newInsight of newInsights) {
    // Check for contradictions — same entity + type but different content
    const contradictionIdx = merged.findIndex(
      (e) =>
        e.entity === newInsight.entity &&
        e.type === newInsight.type &&
        e.content !== newInsight.content,
    );
    if (contradictionIdx >= 0) {
      merged[contradictionIdx] = newInsight; // Replace with newer
      continue;
    }

    // Check for exact duplicates
    const isDupe = merged.some(
      (e) => e.type === newInsight.type && e.content === newInsight.content,
    );
    if (!isDupe) {
      merged.push(newInsight);
    }
  }

  // Cap at 50
  return merged.slice(-50);
}
