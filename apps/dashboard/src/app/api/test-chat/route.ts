import { anthropic } from "@ai-sdk/anthropic";
import { streamText, stepCountIs } from "ai";
import { NextResponse } from "next/server";
import { buildSystemPrompt } from "../chat/platform-knowledge";
import { createChatTools } from "../chat/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for full test suite

const TEST_TEAM_ID = "37a44499-0807-43c2-aed5-38f7909e8627";

interface TestCase {
  name: string;
  message: string;
  expectedTool?: string;
  expectedInResponse?: string[];
  shouldNotContain?: string[];
}

export async function POST(req: Request) {
  // Dev only
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Tests only run in development" },
      { status: 403 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set" },
      { status: 500 },
    );
  }

  const { testCases } = await req.json();
  const results: any[] = [];

  // Build context once
  let businessContext = "";
  try {
    const { buildBusinessContext } = await import(
      "@vendcfo/api/ai/context/build-context"
    );
    businessContext = await buildBusinessContext(TEST_TEAM_ID);
  } catch {
    businessContext =
      "Business context: 14 machines, 10 locations, 5 routes, 235 transactions, 150 invoices, 12 customers.";
  }

  const systemPrompt = buildSystemPrompt(businessContext);
  const tools = createChatTools(TEST_TEAM_ID);

  for (const test of testCases as TestCase[]) {
    const start = Date.now();
    try {
      const result = streamText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: systemPrompt,
        messages: [{ role: "user" as const, content: test.message }],
        tools,
        stopWhen: stepCountIs(5),
        maxOutputTokens: 2048,
      });

      let fullText = "";
      const toolsCalled: string[] = [];
      const toolResults: any[] = [];
      const allEventTypes = new Set<string>();

      for await (const part of result.fullStream) {
        allEventTypes.add(part.type);
        if (part.type === "text-delta") {
          const delta = (part as any).textDelta ?? (part as any).delta ?? "";
          fullText += delta;
        }
        if (part.type === "tool-call") {
          toolsCalled.push(part.toolName);
        }
        if (part.type === "tool-result") {
          toolResults.push({
            tool: (part as any).toolName,
            resultPreview: String((part as any).result).substring(0, 300),
          });
        }
        if (part.type === "tool-error") {
          toolResults.push({
            tool: (part as any).toolName ?? "unknown",
            error: String((part as any).error ?? (part as any).message ?? JSON.stringify(part)).substring(0, 500),
          });
        }
      }

      // Fallback: if stream parsing missed text, use the awaited text property
      if (fullText.includes("undefined") || fullText.length === 0) {
        try {
          fullText = await result.text;
        } catch {
          // text already captured from stream
        }
      }

      // Assertions
      const failures: string[] = [];

      if (test.expectedTool && !toolsCalled.includes(test.expectedTool)) {
        failures.push(
          `Expected tool '${test.expectedTool}' but got [${toolsCalled.join(", ") || "none"}]`,
        );
      }

      if (test.expectedInResponse) {
        for (const keyword of test.expectedInResponse) {
          if (!fullText.toLowerCase().includes(keyword.toLowerCase())) {
            failures.push(`Expected '${keyword}' in response`);
          }
        }
      }

      if (test.shouldNotContain) {
        for (const phrase of test.shouldNotContain) {
          if (fullText.toLowerCase().includes(phrase.toLowerCase())) {
            failures.push(`Found banned phrase '${phrase}'`);
          }
        }
      }

      if (!fullText || fullText.trim().length < 10) {
        failures.push(
          `Response too short: "${fullText.substring(0, 100)}"`,
        );
      }

      results.push({
        name: test.name,
        status: failures.length === 0 ? "PASS" : "FAIL",
        durationMs: Date.now() - start,
        toolsCalled,
        responseLength: fullText.length,
        failures,
        responsePreview: fullText.substring(0, 300),
        toolResults: toolResults.length > 0 ? toolResults : undefined,
        eventTypes: Array.from(allEventTypes),
      });
    } catch (err: any) {
      results.push({
        name: test.name,
        status: "ERROR",
        durationMs: Date.now() - start,
        error: err.message,
      });
    }
  }

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const errored = results.filter((r) => r.status === "ERROR").length;

  return NextResponse.json({
    summary: {
      total: results.length,
      passed,
      failed,
      errored,
      passRate: `${((passed / results.length) * 100).toFixed(1)}%`,
    },
    results,
  });
}
