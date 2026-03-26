// ─── Row-level Validation ─────────────────────────────────────────────────────
// Validates each mapped row before import and returns per-row errors.

import type { TargetTableKey } from "./target-tables";
import { TARGET_TABLES } from "./target-tables";

export interface ColumnMapping {
  header: string;
  field: string;
  confidence: number;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface MappedRow {
  _rowIndex: number;
  [key: string]: string | number | null | undefined;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isNumericish(v: string): boolean {
  return !Number.isNaN(Number(v.replace(/[$,%]/g, "")));
}

// ─── Per-table field validators ───────────────────────────────────────────────

type FieldValidator = (
  value: string,
  field: string,
  rowIndex: number,
) => ValidationError | null;

function requiredValidator(
  value: string,
  field: string,
  rowIndex: number,
): ValidationError | null {
  if (!value || value.trim() === "") {
    return { row: rowIndex, field, message: `${field} is required` };
  }
  return null;
}

function numericValidator(
  value: string,
  field: string,
  rowIndex: number,
): ValidationError | null {
  if (value && value.trim() !== "" && !isNumericish(value)) {
    return {
      row: rowIndex,
      field,
      message: `${field} must be a number`,
    };
  }
  return null;
}

function emailValidator(
  value: string,
  field: string,
  rowIndex: number,
): ValidationError | null {
  if (value && value.trim() !== "" && !isValidEmail(value)) {
    return {
      row: rowIndex,
      field,
      message: `${field} has an invalid email format`,
    };
  }
  return null;
}

const FIELD_VALIDATORS: Record<string, Record<string, FieldValidator[]>> = {
  transactions: {
    date: [requiredValidator],
    amount: [requiredValidator, numericValidator],
  },
  locations: {
    name: [requiredValidator],
    rev_share_pct: [numericValidator],
    monthly_rent: [numericValidator],
    contact_email: [emailValidator],
  },
  machines: {
    serial_number: [requiredValidator],
    capacity_slots: [numericValidator],
    purchase_price: [numericValidator],
  },
  employees: {
    name: [requiredValidator],
    email: [emailValidator],
  },
  skus: {
    name: [requiredValidator],
    unit_cost: [numericValidator],
    retail_price: [numericValidator],
  },
};

// ─── Build mapped rows from raw CSV data ──────────────────────────────────────

export function buildMappedRows(
  headers: string[],
  rows: string[][],
  mappings: ColumnMapping[],
): MappedRow[] {
  const fieldIndexMap: Record<string, number> = {};
  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i];
    if (mapping && mapping.field !== "skip") {
      fieldIndexMap[mapping.field] = i;
    }
  }

  return rows.map((row, rowIdx) => {
    const mapped: MappedRow = { _rowIndex: rowIdx };
    for (const [field, colIdx] of Object.entries(fieldIndexMap)) {
      mapped[field] = row[colIdx] ?? "";
    }
    return mapped;
  });
}

// ─── Validate all rows ───────────────────────────────────────────────────────

export function validateRows(
  mappedRows: MappedRow[],
  targetTable: TargetTableKey,
): ValidationError[] {
  const validators = FIELD_VALIDATORS[targetTable] || {};
  const errors: ValidationError[] = [];

  for (const row of mappedRows) {
    for (const [field, fieldValidators] of Object.entries(validators)) {
      const value = String(row[field] ?? "");
      for (const validate of fieldValidators) {
        const err = validate(value, field, row._rowIndex);
        if (err) {
          errors.push(err);
        }
      }
    }
  }

  return errors;
}

// ─── Check required fields are mapped ─────────────────────────────────────────

export function getMissingRequiredFields(
  mappings: ColumnMapping[],
  targetTable: TargetTableKey,
): string[] {
  const tableDef = TARGET_TABLES[targetTable];
  if (!tableDef) return [];

  const mappedFields = new Set(mappings.map((m) => m.field));
  return tableDef.fields
    .filter((f) => f.required && !mappedFields.has(f.value))
    .map((f) => f.label);
}
