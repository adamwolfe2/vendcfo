import { openai } from "@ai-sdk/openai";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { generateObject } from "ai";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const maxDuration = 30;

const requestSchema = z.object({
  transactions: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      description: z.string().optional(),
    }),
  ),
});

const categorizeSchema = z.object({
  categories: z.array(
    z.object({
      index: z.number().describe("The index of the transaction in the input array"),
      category: z
        .enum([
          "income",
          "inventory-purchase",
          "equipment-purchase",
          "vehicle-expense",
          "location-rent",
          "insurance",
          "repairs-maintenance",
          "fuel-mileage",
          "labor",
          "utilities",
          "other-expense",
          "other-income",
        ])
        .describe("The category slug for this transaction"),
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

    const { transactions } = validation.data;

    // Limit to 50 transactions per request
    const batch = transactions.slice(0, 50);

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: categorizeSchema,
      prompt: `You are a financial categorization assistant for a vending machine business.

Categorize each transaction into one of these categories:
- income (vending revenue, collections, sales)
- inventory-purchase (product restocking, wholesale purchases, COGS)
- equipment-purchase (machine purchases, parts)
- vehicle-expense (gas, maintenance, insurance for route vehicles)
- location-rent (location rent, lease payments)
- insurance (business insurance, liability)
- repairs-maintenance (machine repairs, parts replacement)
- fuel-mileage (gas, mileage reimbursement)
- labor (payroll, contractor payments)
- utilities (phone, internet, software subscriptions)
- other-expense (anything else that's an expense)
- other-income (anything else that's income)

Transactions:
${JSON.stringify(batch.map((t, i) => ({ index: i, name: t.name, amount: t.amount, description: t.description })))}

Rules:
- Positive amounts are typically revenue/income
- Negative amounts are typically expenses
- Use the transaction name and description to determine the most appropriate category
- Be conservative with confidence - only use >0.8 when the category is very clear`,
      temperature: 0.1,
    });

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error categorizing transactions:", error);
    return new Response(
      JSON.stringify({ error: "Failed to categorize transactions" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
