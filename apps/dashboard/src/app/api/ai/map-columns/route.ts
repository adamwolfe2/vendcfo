import { openai } from "@ai-sdk/openai";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { generateObject } from "ai";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const maxDuration = 30;

const requestSchema = z.object({
  headers: z.array(z.string()),
  sampleRows: z.array(z.array(z.string())),
});

const mappingSchema = z.object({
  mappings: z.array(
    z.object({
      header: z.string().describe("The original CSV column header"),
      field: z
        .enum([
          "date",
          "name",
          "amount",
          "category",
          "method",
          "description",
          "counterparty",
          "account",
          "reference",
          "skip",
        ])
        .describe("The system field this column maps to"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("Confidence score from 0.0 to 1.0"),
    }),
  ),
});

export async function POST(req: NextRequest) {
  try {
    const {
      data: { session },
    } = await getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: validation.error.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { headers, sampleRows } = validation.data;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: mappingSchema,
      prompt: `You are a data import assistant for a vending machine business financial platform.

Given these CSV column headers and sample data, map each column to one of our system fields:

System fields:
- date (transaction date)
- name (transaction description/name)
- amount (dollar amount - positive for revenue, negative for expenses)
- category (expense/revenue category)
- method (payment method: cash, card, ach, transfer, check)
- description (additional notes)
- counterparty (vendor/customer name)
- account (bank account name)
- reference (reference/check number)
- skip (don't import this column)

Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows)}

Map each header to the most appropriate system field. Use "skip" for columns that don't match any field (like IDs, running balances, etc). Be generous with confidence scores for obvious matches (dates, amounts) and conservative for ambiguous ones.`,
      temperature: 0.1,
    });

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error mapping columns:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze columns" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
