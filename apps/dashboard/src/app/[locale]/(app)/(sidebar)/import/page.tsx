"use client";

import { Badge } from "@vendcfo/ui/badge";
import { Button } from "@vendcfo/ui/button";
import { Card, CardContent } from "@vendcfo/ui/card";
import { Progress } from "@vendcfo/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vendcfo/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileSpreadsheet,
  FileType,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStep = "upload" | "mapping" | "preview" | "importing";

interface ColumnMapping {
  header: string;
  field: string;
  confidence: number;
}

interface CategoryAssignment {
  index: number;
  category: string;
  confidence: number;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface MappedTransaction {
  date: string;
  name: string;
  amount: number;
  category: string;
  method: string;
  description: string;
  counterparty: string;
  account: string;
  reference: string;
  categoryConfidence: number;
  _rowIndex: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SYSTEM_FIELDS = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name / Description" },
  { value: "amount", label: "Amount" },
  { value: "category", label: "Category" },
  { value: "method", label: "Payment Method" },
  { value: "description", label: "Additional Notes" },
  { value: "counterparty", label: "Counterparty" },
  { value: "account", label: "Bank Account" },
  { value: "reference", label: "Reference Number" },
  { value: "skip", label: "Skip (don't import)" },
];

const CATEGORY_LABELS: Record<string, string> = {
  income: "Income",
  "inventory-purchase": "Inventory Purchase",
  "equipment-purchase": "Equipment Purchase",
  "vehicle-expense": "Vehicle Expense",
  "location-rent": "Location Rent",
  insurance: "Insurance",
  "repairs-maintenance": "Repairs & Maintenance",
  "fuel-mileage": "Fuel / Mileage",
  labor: "Labor",
  utilities: "Utilities",
  "other-expense": "Other Expense",
  "other-income": "Other Income",
};

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSV(text: string): ParsedData {
  // Detect delimiter: tab or comma
  const firstLine = text.split("\n")[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        row.push(current.trim());
        current = "";
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && next === "\n") {
          i++; // skip \r\n
        }
        row.push(current.trim());
        if (row.some((cell) => cell !== "")) {
          rows.push(row);
        }
        row = [];
        current = "";
      } else {
        current += char;
      }
    }
  }

  // Handle last row
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  const headers = rows[0] || [];
  const dataRows = rows.slice(1);

  return { headers, rows: dataRows };
}

// ─── Confidence Badge ────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  if (confidence >= 0.8) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
        {pct}%
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
        {pct}%
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-xs">
      {pct}%
    </Badge>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

const STEPS: { key: WizardStep; label: string; num: number }[] = [
  { key: "upload", label: "Upload", num: 1 },
  { key: "mapping", label: "Map Columns", num: 2 },
  { key: "preview", label: "Preview", num: 3 },
  { key: "importing", label: "Import", num: 4 },
];

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-6 sm:w-10 ${isDone ? "bg-foreground" : "bg-border"}`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border ${
                  isActive
                    ? "bg-foreground text-background border-foreground"
                    : isDone
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border"
                }`}
              >
                {isDone ? (
                  <CheckCircle size={14} />
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  isActive ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ImportPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<WizardStep>("upload");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Mapping state
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isMappingLoading, setIsMappingLoading] = useState(false);

  // Preview/categorize state
  const [mappedTransactions, setMappedTransactions] = useState<MappedTransaction[]>([]);
  const [isCategorizing, setIsCategorizing] = useState(false);

  // Import state
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importSuccess, setImportSuccess] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importComplete, setImportComplete] = useState(false);

  // ─── Upload Handlers ────────────────────────────────────────────────────

  const processFile = useCallback(async (selectedFile: File) => {
    setUploadError("");

    if (selectedFile.size > MAX_FILE_SIZE) {
      setUploadError("File size exceeds 10MB limit. Please use a smaller file.");
      return;
    }

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      setUploadError(
        "Excel files are not supported directly. Please export as CSV first, then upload the CSV file.",
      );
      return;
    }

    if (ext !== "csv" && ext !== "tsv" && ext !== "txt") {
      setUploadError("Unsupported file type. Please upload a CSV or TSV file.");
      return;
    }

    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);

      if (parsed.headers.length === 0) {
        setUploadError("Could not detect any columns in this file.");
        return;
      }

      if (parsed.rows.length === 0) {
        setUploadError("File appears to have headers but no data rows.");
        return;
      }

      setParsedData(parsed);
    } catch {
      setUploadError("Failed to read file. Please check the file format.");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      if (f) processFile(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const clearFile = () => {
    setFile(null);
    setParsedData(null);
    setUploadError("");
  };

  // ─── Column Mapping ─────────────────────────────────────────────────────

  const startMapping = async () => {
    if (!parsedData) return;

    setStep("mapping");
    setIsMappingLoading(true);

    try {
      const sampleRows = parsedData.rows.slice(0, 5);

      const res = await fetch("/api/ai/map-columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: parsedData.headers,
          sampleRows,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze columns");
      }

      const data = await res.json();
      setMappings(data.mappings || []);
    } catch (err) {
      // Fall back to empty mappings so user can map manually
      setMappings(
        parsedData.headers.map((h) => ({
          header: h,
          field: "skip",
          confidence: 0,
        })),
      );
    } finally {
      setIsMappingLoading(false);
    }
  };

  const updateMapping = (headerIndex: number, newField: string) => {
    setMappings((prev) =>
      prev.map((m, i) =>
        i === headerIndex ? { ...m, field: newField, confidence: 1.0 } : m,
      ),
    );
  };

  // ─── Preview & Categorize ──────────────────────────────────────────────

  const buildMappedTransactions = (): MappedTransaction[] => {
    if (!parsedData) return [];

    const fieldIndexMap: Record<string, number> = {};
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      if (mapping && mapping.field !== "skip") {
        fieldIndexMap[mapping.field] = i;
      }
    }

    return parsedData.rows.map((row, rowIdx) => {
      const get = (field: string) => {
        const idx = fieldIndexMap[field];
        return idx !== undefined ? (row[idx] || "") : "";
      };

      const rawAmount = get("amount").replace(/[$,]/g, "");
      const amount = Number.parseFloat(rawAmount) || 0;

      return {
        date: get("date"),
        name: get("name"),
        amount,
        category: get("category"),
        method: get("method") || "other",
        description: get("description"),
        counterparty: get("counterparty"),
        account: get("account"),
        reference: get("reference"),
        categoryConfidence: 0,
        _rowIndex: rowIdx,
      };
    });
  };

  const startPreview = async () => {
    const transactions = buildMappedTransactions();
    setMappedTransactions(transactions);
    setStep("preview");
    setIsCategorizing(true);

    try {
      // Only categorize transactions that don't already have a category
      const uncategorized = transactions
        .map((t, i) => ({ ...t, _originalIndex: i }))
        .filter((t) => !t.category);

      if (uncategorized.length === 0) {
        setIsCategorizing(false);
        return;
      }

      // Batch into groups of 50
      for (let i = 0; i < uncategorized.length; i += 50) {
        const batch = uncategorized.slice(i, i + 50);
        const res = await fetch("/api/ai/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactions: batch.map((t) => ({
              name: t.name,
              amount: t.amount,
              description: t.description || undefined,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setMappedTransactions((prev) => {
            const updated = [...prev];
            for (const cat of data.categories || []) {
              const batchItem = batch[cat.index];
              if (batchItem !== undefined) {
                const origIdx = batchItem._originalIndex;
                const existing = updated[origIdx];
                if (existing) {
                  updated[origIdx] = {
                    ...existing,
                    category: cat.category,
                    categoryConfidence: cat.confidence,
                  };
                }
              }
            }
            return updated;
          });
        }
      }
    } catch {
      // Categories are optional, continue without them
    } finally {
      setIsCategorizing(false);
    }
  };

  const updateCategory = (rowIndex: number, newCategory: string) => {
    setMappedTransactions((prev) =>
      prev.map((t) =>
        t._rowIndex === rowIndex
          ? { ...t, category: newCategory, categoryConfidence: 1.0 }
          : t,
      ),
    );
  };

  // ─── Import ────────────────────────────────────────────────────────────

  const startImport = async () => {
    setStep("importing");
    const total = mappedTransactions.length;
    setImportTotal(total);
    setImportProgress(0);
    setImportSuccess(0);
    setImportErrors([]);
    setImportComplete(false);

    // Import using the existing server action
    const { submitVendingData } = await import("./actions");

    // Build a CSV string from mapped transactions to pass through existing pipeline
    const csvHeaders = [
      "Date",
      "Description",
      "Amount",
      "Category",
      "Method",
      "Notes",
      "Counterparty",
      "Account",
      "Reference",
    ];

    const csvRows = mappedTransactions.map((t) =>
      [
        t.date,
        `"${(t.name || "").replace(/"/g, '""')}"`,
        t.amount.toString(),
        t.category,
        t.method,
        `"${(t.description || "").replace(/"/g, '""')}"`,
        `"${(t.counterparty || "").replace(/"/g, '""')}"`,
        t.account,
        t.reference,
      ].join(","),
    );

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const csvFile = new File([blob], "import.csv", { type: "text/csv" });

    const formData = new FormData();
    formData.append("csvFile", csvFile);

    try {
      const result = await submitVendingData(formData);

      if (result.success) {
        setImportProgress(total);
        setImportSuccess(total);
      } else {
        setImportErrors([result.error || "Import failed"]);
      }
    } catch (e: any) {
      setImportErrors([e.message || "Unknown error during import"]);
    }

    setImportComplete(true);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-foreground mb-1">
        Import Spreadsheet Data
      </h1>
      <p className="text-muted-foreground mb-6">
        Upload CSV exports and let AI map your columns and categorize transactions.
      </p>

      <StepIndicator current={step} />

      {/* ─── Step 1: Upload ─────────────────────────────────────────────── */}
      {step === "upload" && (
        <div>
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              {!parsedData ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center transition relative ${
                    isDragOver
                      ? "border-foreground bg-secondary"
                      : "border-border hover:bg-secondary/50"
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    Drag and drop your CSV file here
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    or click to browse. Supports CSV and TSV files up to 10MB.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileType className="text-blue-600" size={24} />
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {file?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {parsedData.headers.length} columns,{" "}
                          {parsedData.rows.length} rows
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="p-1.5 rounded-md hover:bg-secondary transition"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  </div>

                  {/* Preview table */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary border-b border-border">
                            {parsedData.headers.map((h, i) => (
                              <th
                                key={`header-${h}-${i}`}
                                className="px-3 py-2 text-left font-medium text-foreground whitespace-nowrap first:sticky first:left-0 first:z-10 first:bg-secondary"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.rows.slice(0, 5).map((row, ri) => (
                            <tr
                              key={`row-${ri}`}
                              className="border-b border-border last:border-0"
                            >
                              {row.map((cell, ci) => (
                                <td
                                  key={`cell-${ri}-${ci}`}
                                  className="px-3 py-2 text-muted-foreground whitespace-nowrap max-w-[200px] truncate first:sticky first:left-0 first:z-10 first:bg-background"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedData.rows.length > 5 && (
                      <div className="px-3 py-2 bg-secondary text-xs text-muted-foreground text-center border-t border-border">
                        Showing 5 of {parsedData.rows.length} rows
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {uploadError && (
            <Card className="mb-6 border-l-4 border-l-red-500">
              <CardContent className="p-4 flex items-start">
                <AlertCircle
                  className="text-red-500 mr-3 mt-0.5 flex-shrink-0"
                  size={20}
                />
                <div>
                  <h4 className="font-medium text-foreground">Upload Error</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {uploadError}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {parsedData && (
            <div className="flex justify-end">
              <Button
                onClick={startMapping}
                className="min-h-[44px] w-full sm:w-auto"
              >
                <Sparkles size={16} className="mr-2" />
                Continue - Map Columns with AI
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: Column Mapping ─────────────────────────────────────── */}
      {step === "mapping" && (
        <div>
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              {isMappingLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-muted-foreground mb-4" />
                  <p className="text-foreground font-medium">Analyzing your data...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI is detecting column types from your headers and sample data
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <FileSpreadsheet size={20} className="text-muted-foreground" />
                    <h3 className="font-medium text-foreground">
                      Map your CSV columns to system fields
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {mappings.map((mapping, idx) => (
                      <div
                        key={`mapping-${mapping.header}-${idx}`}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border border-border bg-background"
                      >
                        <div className="flex items-center gap-2 sm:w-1/3 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">
                            {mapping.header}
                          </span>
                          <ConfidenceBadge confidence={mapping.confidence} />
                        </div>

                        <ArrowRight
                          size={16}
                          className="text-muted-foreground hidden sm:block flex-shrink-0"
                        />

                        <div className="sm:flex-1">
                          <Select
                            value={mapping.field}
                            onValueChange={(val) => updateMapping(idx, val)}
                          >
                            <SelectTrigger className="w-full min-h-[44px]">
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {SYSTEM_FIELDS.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Show sample value */}
                        {parsedData && parsedData.rows[0] && (
                          <span className="text-xs text-muted-foreground truncate max-w-[150px] hidden lg:block">
                            e.g. "{parsedData.rows[0][idx]}"
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Validation warnings */}
                  {!mappings.some((m) => m.field === "date") && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                      <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        No column mapped to "Date". Transactions need a date to import correctly.
                      </p>
                    </div>
                  )}
                  {!mappings.some((m) => m.field === "amount") && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                      <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        No column mapped to "Amount". Transactions need an amount value.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {!isMappingLoading && (
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="min-h-[44px] w-full sm:w-auto"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <Button
                onClick={startPreview}
                disabled={
                  !mappings.some((m) => m.field === "date") ||
                  !mappings.some((m) => m.field === "amount")
                }
                className="min-h-[44px] w-full sm:w-auto"
              >
                <Sparkles size={16} className="mr-2" />
                Continue - Categorize with AI
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 3: Preview & Categorize ───────────────────────────────── */}
      {step === "preview" && (
        <div>
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              {isCategorizing && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-secondary rounded-lg border border-border">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  <p className="text-sm text-foreground">
                    AI is categorizing your transactions...
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">
                  Ready to import {mappedTransactions.length} transactions
                </h3>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary border-b border-border">
                        <th className="px-3 py-2 text-left font-medium text-foreground whitespace-nowrap sticky left-0 z-10 bg-secondary">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-foreground whitespace-nowrap">
                          Name
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-foreground whitespace-nowrap">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-foreground whitespace-nowrap min-w-[200px]">
                          Category
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-foreground whitespace-nowrap">
                          Method
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappedTransactions.slice(0, 50).map((t) => (
                        <tr
                          key={`tx-${t._rowIndex}`}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-3 py-2 text-foreground whitespace-nowrap sticky left-0 z-10 bg-background">
                            {t.date}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground whitespace-nowrap max-w-[200px] truncate">
                            {t.name}
                          </td>
                          <td
                            className={`px-3 py-2 text-right whitespace-nowrap font-mono ${
                              t.amount >= 0 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {t.amount >= 0 ? "+" : ""}
                            {t.amount.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Select
                                value={t.category || "other-expense"}
                                onValueChange={(val) =>
                                  updateCategory(t._rowIndex, val)
                                }
                              >
                                <SelectTrigger className="w-full min-h-[36px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                      {c.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {t.categoryConfidence > 0 && (
                                <ConfidenceBadge confidence={t.categoryConfidence} />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground whitespace-nowrap text-xs">
                            {t.method}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {mappedTransactions.length > 50 && (
                  <div className="px-3 py-2 bg-secondary text-xs text-muted-foreground text-center border-t border-border">
                    Showing 50 of {mappedTransactions.length} transactions. All
                    will be imported.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("mapping")}
              className="min-h-[44px] w-full sm:w-auto"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <Button
              onClick={startImport}
              disabled={isCategorizing}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Import {mappedTransactions.length} Transactions
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Import & Results ───────────────────────────────────── */}
      {step === "importing" && (
        <div>
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              {!importComplete ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-muted-foreground mb-4" />
                  <p className="text-foreground font-medium mb-4">
                    Importing transactions...
                  </p>
                  <div className="w-full max-w-md">
                    <Progress
                      value={
                        importTotal > 0
                          ? (importProgress / importTotal) * 100
                          : 0
                      }
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {importProgress} of {importTotal}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  {importErrors.length === 0 ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <CheckCircle size={24} className="text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-1">
                        Import Complete
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Successfully imported {importSuccess} transactions.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                        <AlertCircle size={24} className="text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-1">
                        Import Completed with Issues
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {importSuccess > 0
                          ? `Imported ${importSuccess} transactions.`
                          : "No transactions were imported."}
                      </p>
                      <div className="w-full max-w-md space-y-2">
                        {importErrors.map((err, i) => (
                          <div
                            key={`err-${i}`}
                            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
                          >
                            {err}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep("upload");
                        setFile(null);
                        setParsedData(null);
                        setMappings([]);
                        setMappedTransactions([]);
                        setImportComplete(false);
                        setImportErrors([]);
                      }}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      Import Another File
                    </Button>
                    <Button
                      onClick={() => router.push("/transactions")}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      View Transactions
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
