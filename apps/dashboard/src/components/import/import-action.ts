// ─── Import Action ────────────────────────────────────────────────────────────
// Client-side import logic that inserts mapped rows into Supabase tables.
// Each table has its own payload builder to ensure correct column names and types.

import { createClient } from "@vendcfo/supabase/client";
import type { TargetTableKey } from "./target-tables";
import type { MappedRow } from "./validators";

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  errors: string[];
}

type PayloadBuilder = (
  row: MappedRow,
  teamId: string,
  context: ImportContext,
) => Record<string, unknown> | null;

interface ImportContext {
  locationNameToId: Record<string, string>;
}

// ─── Payload builders per table ──────────────────────────────────────────────

function buildTransactionPayload(
  row: MappedRow,
  teamId: string,
): Record<string, unknown> | null {
  const rawAmount = String(row.amount ?? "").replace(/[$,]/g, "");
  const amount = Number.parseFloat(rawAmount);
  if (Number.isNaN(amount)) return null;

  return {
    team_id: teamId,
    date: String(row.date ?? ""),
    name: String(row.name ?? ""),
    amount,
    category_slug: String(row.category ?? "") || null,
    method: String(row.method ?? "other"),
    description: String(row.description ?? "") || null,
    note: String(row.description ?? "") || null,
    status: "posted",
    manual: true,
  };
}

function buildLocationPayload(
  row: MappedRow,
  teamId: string,
): Record<string, unknown> | null {
  const name = String(row.name ?? "").trim();
  if (!name) return null;

  return {
    business_id: teamId,
    name,
    address: String(row.address ?? "").trim() || null,
    location_type: String(row.location_type ?? "other").toLowerCase(),
    rev_share_pct:
      Number.parseFloat(String(row.rev_share_pct ?? "0").replace(/%/g, "")) ||
      0,
    contact_name: String(row.contact_name ?? "").trim() || null,
    contact_email: String(row.contact_email ?? "").trim() || null,
    monthly_rent:
      Number.parseFloat(
        String(row.monthly_rent ?? "0").replace(/[$,]/g, ""),
      ) || 0,
    is_active: true,
  };
}

function buildMachinePayload(
  row: MappedRow,
  teamId: string,
  context: ImportContext,
): Record<string, unknown> | null {
  const serialNumber = String(row.serial_number ?? "").trim();
  if (!serialNumber) return null;

  const locationName = String(row.location_name ?? "").trim();
  const locationId = locationName
    ? context.locationNameToId[locationName.toLowerCase()] || null
    : null;

  return {
    business_id: teamId,
    serial_number: serialNumber,
    make_model: String(row.make_model ?? "").trim() || null,
    machine_type: String(row.machine_type ?? "other").toLowerCase(),
    capacity_slots:
      Number.parseInt(String(row.capacity_slots ?? ""), 10) || null,
    purchase_price:
      Number.parseFloat(
        String(row.purchase_price ?? "").replace(/[$,]/g, ""),
      ) || null,
    location_id: locationId,
    date_acquired: String(row.date_acquired ?? "").trim() || null,
    is_active: true,
  };
}

function buildEmployeePayload(
  row: MappedRow,
  teamId: string,
): Record<string, unknown> | null {
  const name = String(row.name ?? "").trim();
  if (!name) return null;

  const empType = String(row.employment_type ?? "w2").toLowerCase();
  const normalizedType =
    empType === "1099" || empType === "contractor" ? "1099" : "w2";

  return {
    business_id: teamId,
    name,
    email: String(row.email ?? "").trim() || null,
    phone: String(row.phone ?? "").trim() || null,
    role: String(row.role ?? "").trim() || null,
    employment_type: normalizedType,
    hire_date: String(row.hire_date ?? "").trim() || null,
    is_active: true,
  };
}

function buildSkuPayload(
  row: MappedRow,
  teamId: string,
): Record<string, unknown> | null {
  const name = String(row.name ?? "").trim();
  if (!name) return null;

  const unitCost =
    Number.parseFloat(String(row.unit_cost ?? "0").replace(/[$,]/g, "")) || 0;
  const retailPrice =
    Number.parseFloat(
      String(row.retail_price ?? "0").replace(/[$,]/g, ""),
    ) || 0;
  const margin =
    retailPrice > 0
      ? Math.round(((retailPrice - unitCost) / retailPrice) * 1000) / 10
      : 0;

  return {
    business_id: teamId,
    name,
    category: String(row.category ?? "other").toLowerCase(),
    unit_cost: unitCost,
    retail_price: retailPrice,
    target_margin_pct: margin,
    upc_code: String(row.upc_code ?? "").trim() || null,
    supplier: String(row.supplier ?? "").trim() || null,
  };
}

const PAYLOAD_BUILDERS: Record<TargetTableKey, PayloadBuilder> = {
  transactions: (row, teamId) => buildTransactionPayload(row, teamId),
  locations: (row, teamId) => buildLocationPayload(row, teamId),
  machines: (row, teamId, ctx) => buildMachinePayload(row, teamId, ctx),
  employees: (row, teamId) => buildEmployeePayload(row, teamId),
  skus: (row, teamId) => buildSkuPayload(row, teamId),
};

// ─── Main import function ────────────────────────────────────────────────────

const BATCH_SIZE = 50;

export async function importRows(
  rows: MappedRow[],
  targetTable: TargetTableKey,
  teamId: string,
  onProgress?: (imported: number, total: number) => void,
): Promise<ImportResult> {
  // Cast to `any` because the generated DB types don't yet include the
  // locations / machines / employees / skus tables. Once the Supabase types
  // are regenerated this cast can be removed.
  const supabase: any = createClient();
  const errors: string[] = [];
  let importedCount = 0;
  const total = rows.length;

  // Pre-fetch location names for machine imports (name -> ID lookup)
  const context: ImportContext = { locationNameToId: {} };
  if (targetTable === "machines") {
    try {
      const { data: locations } = await supabase
        .from("locations")
        .select("id, name")
        .eq("business_id", teamId);

      if (locations) {
        for (const loc of locations as Array<{ id: string; name: string }>) {
          context.locationNameToId[loc.name.toLowerCase()] = loc.id;
        }
      }
    } catch {
      // Location lookup is best-effort
    }
  }

  const builder = PAYLOAD_BUILDERS[targetTable];
  const tableName =
    targetTable === "transactions" ? "transactions" : targetTable;

  // Build all payloads first
  const payloads: Record<string, unknown>[] = [];
  for (const row of rows) {
    const payload = builder(row, teamId, context);
    if (payload) {
      payloads.push(payload);
    } else {
      errors.push(`Row ${row._rowIndex + 1}: skipped (missing required data)`);
    }
  }

  // Insert in batches
  for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
    const batch = payloads.slice(i, i + BATCH_SIZE);

    try {
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(batch);

      if (insertError) {
        errors.push(
          `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`,
        );
      } else {
        importedCount += batch.length;
      }
    } catch (err: any) {
      errors.push(
        `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message || "Unknown error"}`,
      );
    }

    onProgress?.(importedCount, total);
  }

  return {
    success: errors.length === 0,
    importedCount,
    errorCount: total - importedCount,
    errors,
  };
}
