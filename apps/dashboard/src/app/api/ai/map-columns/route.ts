import { openai } from "@ai-sdk/openai";
import { getSession } from "@vendcfo/supabase/cached-queries";
import { generateObject } from "ai";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const maxDuration = 30;

const TARGET_TABLE_SCHEMAS: Record<
  string,
  { fields: string[]; descriptions: string }
> = {
  transactions: {
    fields: [
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
    ],
    descriptions: `- date (transaction date)
- name (transaction description/name)
- amount (dollar amount - positive for revenue, negative for expenses)
- category (expense/revenue category)
- method (payment method: cash, card, ach, transfer, check)
- description (additional notes)
- counterparty (vendor/customer name)
- account (bank account name)
- reference (reference/check number)
- skip (don't import this column)`,
  },
  locations: {
    fields: [
      "name",
      "address",
      "location_type",
      "rev_share_pct",
      "contact_name",
      "contact_email",
      "machine_count",
      "monthly_rent",
      "skip",
    ],
    descriptions: `- name (location name, required)
- address (street address)
- location_type (e.g. office, warehouse, retail, school, hospital, gym, hotel, factory, other)
- rev_share_pct (revenue share percentage with location owner, 0-100)
- contact_name (on-site contact person name)
- contact_email (contact email address)
- machine_count (number of machines at this location)
- monthly_rent (monthly rent amount)
- skip (don't import this column)`,
  },
  machines: {
    fields: [
      "serial_number",
      "make_model",
      "machine_type",
      "capacity_slots",
      "purchase_price",
      "location_name",
      "date_acquired",
      "skip",
    ],
    descriptions: `- serial_number (machine serial number, required)
- make_model (manufacturer and model)
- machine_type (e.g. snack, drink, combo, coffee, ice-cream, micro-market, other)
- capacity_slots (number of product slots/selections)
- purchase_price (original purchase price)
- location_name (name of the location where machine is placed - will be matched to existing locations)
- date_acquired (date machine was acquired)
- skip (don't import this column)`,
  },
  employees: {
    fields: [
      "name",
      "email",
      "phone",
      "role",
      "employment_type",
      "hire_date",
      "skip",
    ],
    descriptions: `- name (employee full name, required)
- email (employee email address)
- phone (phone number)
- role (job title or role: driver, technician, warehouse, manager, admin, other)
- employment_type (w2 or 1099)
- hire_date (date hired)
- skip (don't import this column)`,
  },
  skus: {
    fields: [
      "name",
      "category",
      "unit_cost",
      "retail_price",
      "supplier",
      "upc_code",
      "skip",
    ],
    descriptions: `- name (product name, required)
- category (product category: soda, water, juice, energy, snack, candy, chip, pastry, healthy, other)
- unit_cost (wholesale cost per unit)
- retail_price (selling price per unit)
- supplier (supplier/vendor name)
- upc_code (UPC barcode)
- skip (don't import this column)`,
  },
};

const requestSchema = z.object({
  headers: z.array(z.string()),
  sampleRows: z.array(z.array(z.string())),
  targetTable: z
    .enum(["transactions", "locations", "machines", "employees", "skus"])
    .default("transactions"),
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

    const { headers, sampleRows, targetTable } = validation.data;
    const schema = TARGET_TABLE_SCHEMAS[targetTable];

    if (!schema) {
      return new Response(
        JSON.stringify({ error: "Unknown target table" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const mappingSchema = z.object({
      mappings: z.array(
        z.object({
          header: z.string().describe("The original CSV column header"),
          field: z
            .enum(schema.fields as [string, ...string[]])
            .describe("The system field this column maps to"),
          confidence: z
            .number()
            .min(0)
            .max(1)
            .describe("Confidence score from 0.0 to 1.0"),
        }),
      ),
    });

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: mappingSchema,
      prompt: `You are a data import assistant for a vending machine business management platform.

Given these CSV column headers and sample data, map each column to one of our system fields for the "${targetTable}" table.

System fields for ${targetTable}:
${schema.descriptions}

Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows)}

Map each header to the most appropriate system field. Use "skip" for columns that don't match any field (like IDs, running balances, etc). Be generous with confidence scores for obvious matches and conservative for ambiguous ones.`,
      temperature: 0.1,
    });

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to analyze columns" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
