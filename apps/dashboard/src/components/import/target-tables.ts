// ─── Target Table Definitions ─────────────────────────────────────────────────
// Each target defines the fields available for column mapping, required fields,
// and the display labels for the preview table.

export type TargetTableKey =
  | "transactions"
  | "locations"
  | "machines"
  | "employees"
  | "skus";

export interface TargetField {
  value: string;
  label: string;
  required?: boolean;
}

export interface TargetTableDef {
  key: TargetTableKey;
  label: string;
  description: string;
  supabaseTable: string;
  fields: TargetField[];
  previewColumns: string[];
}

const SKIP_FIELD: TargetField = {
  value: "skip",
  label: "Skip (don't import)",
};

export const TARGET_TABLES: Record<TargetTableKey, TargetTableDef> = {
  transactions: {
    key: "transactions",
    label: "Transactions",
    description:
      "Financial transactions such as income, expenses, and purchases.",
    supabaseTable: "transactions",
    fields: [
      { value: "date", label: "Date", required: true },
      { value: "name", label: "Name / Description", required: true },
      { value: "amount", label: "Amount", required: true },
      { value: "category", label: "Category" },
      { value: "method", label: "Payment Method" },
      { value: "description", label: "Additional Notes" },
      { value: "counterparty", label: "Counterparty" },
      { value: "account", label: "Bank Account" },
      { value: "reference", label: "Reference Number" },
      SKIP_FIELD,
    ],
    previewColumns: ["date", "name", "amount", "category", "method"],
  },
  locations: {
    key: "locations",
    label: "Locations",
    description:
      "Vending machine placement sites with contact and revenue-share info.",
    supabaseTable: "locations",
    fields: [
      { value: "name", label: "Location Name", required: true },
      { value: "address", label: "Address" },
      { value: "location_type", label: "Location Type" },
      { value: "rev_share_pct", label: "Revenue Share %" },
      { value: "contact_name", label: "Contact Name" },
      { value: "contact_email", label: "Contact Email" },
      { value: "machine_count", label: "Machine Count" },
      { value: "monthly_rent", label: "Monthly Rent" },
      SKIP_FIELD,
    ],
    previewColumns: [
      "name",
      "address",
      "location_type",
      "rev_share_pct",
      "contact_name",
    ],
  },
  machines: {
    key: "machines",
    label: "Machines",
    description:
      "Vending machines with serial numbers, types, and placement info.",
    supabaseTable: "machines",
    fields: [
      { value: "serial_number", label: "Serial Number", required: true },
      { value: "make_model", label: "Make / Model" },
      { value: "machine_type", label: "Machine Type" },
      { value: "capacity_slots", label: "Capacity (Slots)" },
      { value: "purchase_price", label: "Purchase Price" },
      { value: "location_name", label: "Location (Name)" },
      { value: "date_acquired", label: "Date Acquired" },
      SKIP_FIELD,
    ],
    previewColumns: [
      "serial_number",
      "make_model",
      "machine_type",
      "capacity_slots",
      "location_name",
    ],
  },
  employees: {
    key: "employees",
    label: "Employees",
    description:
      "Team members including drivers, technicians, and office staff.",
    supabaseTable: "employees",
    fields: [
      { value: "name", label: "Full Name", required: true },
      { value: "email", label: "Email" },
      { value: "phone", label: "Phone" },
      { value: "role", label: "Role" },
      { value: "employment_type", label: "Employment Type (W2/1099)" },
      { value: "hire_date", label: "Hire Date" },
      SKIP_FIELD,
    ],
    previewColumns: ["name", "email", "phone", "role", "employment_type"],
  },
  skus: {
    key: "skus",
    label: "Products / SKUs",
    description:
      "Product catalog with pricing, cost, and supplier information.",
    supabaseTable: "skus",
    fields: [
      { value: "name", label: "Product Name", required: true },
      { value: "category", label: "Category" },
      { value: "unit_cost", label: "Unit Cost" },
      { value: "retail_price", label: "Retail Price" },
      { value: "supplier", label: "Supplier" },
      { value: "upc_code", label: "UPC Code" },
      SKIP_FIELD,
    ],
    previewColumns: ["name", "category", "unit_cost", "retail_price", "supplier"],
  },
};

export const TARGET_TABLE_LIST = Object.values(TARGET_TABLES);

// ─── Fuzzy Fallback Matchers ──────────────────────────────────────────────────
// Used when the AI mapping endpoint fails.

type FuzzyRule = { pattern: RegExp; field: string; confidence: number };

const COMMON_RULES: FuzzyRule[] = [
  { pattern: /^skip$/i, field: "skip", confidence: 0 },
];

const TABLE_FUZZY_RULES: Record<TargetTableKey, FuzzyRule[]> = {
  transactions: [
    { pattern: /date|time|day|when|period/i, field: "date", confidence: 0.8 },
    {
      pattern: /amount|total|sum|price|value|cost|revenue|sales/i,
      field: "amount",
      confidence: 0.8,
    },
    {
      pattern: /desc|description|memo|note|detail|name|narration/i,
      field: "name",
      confidence: 0.7,
    },
    {
      pattern: /category|type|class|group|dept/i,
      field: "category",
      confidence: 0.7,
    },
    {
      pattern: /method|payment|pay.*type|instrument/i,
      field: "method",
      confidence: 0.6,
    },
    {
      pattern: /vendor|payee|counterparty|merchant|supplier|customer/i,
      field: "counterparty",
      confidence: 0.6,
    },
    {
      pattern: /account|bank|acct/i,
      field: "account",
      confidence: 0.6,
    },
    {
      pattern: /ref|reference|check.*no|number|id/i,
      field: "reference",
      confidence: 0.5,
    },
  ],
  locations: [
    {
      pattern: /^name$|location.*name|site.*name|place/i,
      field: "name",
      confidence: 0.8,
    },
    {
      pattern: /address|street|addr/i,
      field: "address",
      confidence: 0.8,
    },
    {
      pattern: /type|location.*type|category/i,
      field: "location_type",
      confidence: 0.7,
    },
    {
      pattern: /rev.*share|share.*pct|commission/i,
      field: "rev_share_pct",
      confidence: 0.7,
    },
    {
      pattern: /contact.*name|poc|point.*contact/i,
      field: "contact_name",
      confidence: 0.7,
    },
    {
      pattern: /contact.*email|email/i,
      field: "contact_email",
      confidence: 0.6,
    },
    {
      pattern: /machine.*count|machines|num.*machine/i,
      field: "machine_count",
      confidence: 0.6,
    },
    {
      pattern: /rent|monthly.*rent/i,
      field: "monthly_rent",
      confidence: 0.7,
    },
  ],
  machines: [
    {
      pattern: /serial|sn|serial.*num/i,
      field: "serial_number",
      confidence: 0.9,
    },
    {
      pattern: /make|model|make.*model|brand/i,
      field: "make_model",
      confidence: 0.8,
    },
    {
      pattern: /type|machine.*type|kind/i,
      field: "machine_type",
      confidence: 0.7,
    },
    {
      pattern: /capacity|slots|selections/i,
      field: "capacity_slots",
      confidence: 0.7,
    },
    {
      pattern: /price|purchase.*price|cost|value/i,
      field: "purchase_price",
      confidence: 0.7,
    },
    {
      pattern: /location|site|placed|where/i,
      field: "location_name",
      confidence: 0.6,
    },
    {
      pattern: /date.*acquired|acquired|purchase.*date/i,
      field: "date_acquired",
      confidence: 0.7,
    },
  ],
  employees: [
    {
      pattern: /^name$|full.*name|employee.*name|first.*name/i,
      field: "name",
      confidence: 0.8,
    },
    { pattern: /email|e-mail/i, field: "email", confidence: 0.8 },
    { pattern: /phone|mobile|cell|tel/i, field: "phone", confidence: 0.8 },
    {
      pattern: /role|title|position|job/i,
      field: "role",
      confidence: 0.7,
    },
    {
      pattern: /employment.*type|type|w2|1099|contractor/i,
      field: "employment_type",
      confidence: 0.7,
    },
    {
      pattern: /hire.*date|start.*date|date.*hired/i,
      field: "hire_date",
      confidence: 0.8,
    },
  ],
  skus: [
    {
      pattern: /^name$|product.*name|item.*name|sku.*name/i,
      field: "name",
      confidence: 0.8,
    },
    {
      pattern: /category|type|group/i,
      field: "category",
      confidence: 0.7,
    },
    {
      pattern: /unit.*cost|cost|wholesale/i,
      field: "unit_cost",
      confidence: 0.8,
    },
    {
      pattern: /retail.*price|price|sell.*price|msrp/i,
      field: "retail_price",
      confidence: 0.8,
    },
    {
      pattern: /supplier|vendor|distributor/i,
      field: "supplier",
      confidence: 0.7,
    },
    { pattern: /upc|barcode|ean/i, field: "upc_code", confidence: 0.8 },
  ],
};

export function fuzzyMatchColumn(
  header: string,
  targetTable: TargetTableKey,
): { field: string; confidence: number } {
  const lower = header.toLowerCase().trim();
  const rules = [...COMMON_RULES, ...(TABLE_FUZZY_RULES[targetTable] || [])];

  for (const rule of rules) {
    if (rule.pattern.test(lower)) {
      return { field: rule.field, confidence: rule.confidence };
    }
  }

  return { field: "skip", confidence: 0 };
}
