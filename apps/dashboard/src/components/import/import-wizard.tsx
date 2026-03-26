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

import { type ParsedData, MAX_FILE_SIZE, parseCSV } from "./csv-parser";
import { importRows, type ImportResult } from "./import-action";
import {
  type TargetTableKey,
  TARGET_TABLES,
  TARGET_TABLE_LIST,
  fuzzyMatchColumn,
} from "./target-tables";
import {
  type ColumnMapping,
  type MappedRow,
  type ValidationError,
  buildMappedRows,
  getMissingRequiredFields,
  validateRows,
} from "./validators";

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStep =
  | "upload"
  | "target"
  | "mapping"
  | "preview"
  | "importing";

// ─── Confidence Badge ────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  if (confidence >= 0.8) {
    return (
      <Badge
        variant="secondary"
        className="bg-green-100 text-green-800 border-green-200 text-xs"
      >
        {pct}%
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge
        variant="secondary"
        className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs"
      >
        {pct}%
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="bg-red-100 text-red-800 border-red-200 text-xs"
    >
      {pct}%
    </Badge>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

const STEPS: { key: WizardStep; label: string; num: number }[] = [
  { key: "upload", label: "Upload", num: 1 },
  { key: "target", label: "Select Table", num: 2 },
  { key: "mapping", label: "Map Columns", num: 3 },
  { key: "preview", label: "Preview & Validate", num: 4 },
  { key: "importing", label: "Import", num: 5 },
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
                className={`h-px w-4 sm:w-8 ${isDone ? "bg-foreground" : "bg-border"}`}
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
                {isDone ? <CheckCircle size={14} /> : step.num}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
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

// ─── Target Table Card ──────────────────────────────────────────────────────

function TargetTableCard({
  tableKey,
  selected,
  onSelect,
}: {
  tableKey: TargetTableKey;
  selected: boolean;
  onSelect: () => void;
}) {
  const def = TARGET_TABLES[tableKey];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition ${
        selected
          ? "border-foreground bg-secondary"
          : "border-border hover:border-foreground/30 hover:bg-secondary/50"
      }`}
    >
      <h4 className="font-medium text-foreground mb-1">{def.label}</h4>
      <p className="text-sm text-muted-foreground">{def.description}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {def.fields
          .filter((f) => f.value !== "skip")
          .slice(0, 5)
          .map((f) => (
            <Badge
              key={f.value}
              variant="outline"
              className="text-xs font-normal"
            >
              {f.label}
              {f.required ? " *" : ""}
            </Badge>
          ))}
        {def.fields.filter((f) => f.value !== "skip").length > 5 && (
          <Badge variant="outline" className="text-xs font-normal">
            +{def.fields.filter((f) => f.value !== "skip").length - 5} more
          </Badge>
        )}
      </div>
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ImportWizard({ teamId }: { teamId: string }) {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<WizardStep>("upload");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Target table state
  const [targetTable, setTargetTable] =
    useState<TargetTableKey>("transactions");

  // Mapping state
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isMappingLoading, setIsMappingLoading] = useState(false);

  // Preview state
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );

  // Import state
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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
          targetTable,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze columns");
      }

      const data = await res.json();
      setMappings(data.mappings || []);
    } catch {
      // AI failed -- fall back to fuzzy keyword matching
      setMappings(
        parsedData.headers.map((h) => {
          const match = fuzzyMatchColumn(h, targetTable);
          return { header: h, field: match.field, confidence: match.confidence };
        }),
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

  // ─── Preview & Validate ─────────────────────────────────────────────────

  const startPreview = () => {
    if (!parsedData) return;

    const rows = buildMappedRows(parsedData.headers, parsedData.rows, mappings);
    setMappedRows(rows);

    const errors = validateRows(rows, targetTable);
    setValidationErrors(errors);

    setStep("preview");
  };

  // ─── Import ─────────────────────────────────────────────────────────────

  const startImport = async () => {
    setStep("importing");
    const total = mappedRows.length;
    setImportTotal(total);
    setImportProgress(0);
    setImportResult(null);

    const result = await importRows(
      mappedRows,
      targetTable,
      teamId,
      (imported, _total) => {
        setImportProgress(imported);
      },
    );

    setImportProgress(result.importedCount);
    setImportResult(result);
  };

  const resetWizard = () => {
    setStep("upload");
    setFile(null);
    setParsedData(null);
    setMappings([]);
    setMappedRows([]);
    setValidationErrors([]);
    setImportResult(null);
    setUploadError("");
    setTargetTable("transactions");
  };

  // ─── Computed values ────────────────────────────────────────────────────

  const tableDef = TARGET_TABLES[targetTable];
  const missingRequired = getMissingRequiredFields(mappings, targetTable);
  const hasValidationErrors = validationErrors.length > 0;
  const errorRowSet = new Set(validationErrors.map((e) => e.row));

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-foreground mb-1">
        Import Spreadsheet Data
      </h1>
      <p className="text-muted-foreground mb-6">
        Upload CSV exports and let AI map your columns to the right fields.
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
                  <UploadCloud
                    size={48}
                    className="text-muted-foreground mb-4"
                  />
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    Drag and drop your CSV file here
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    or click to browse. Supports CSV and TSV files up to 10MB.
                  </p>
                  <div className="flex items-center gap-4 mt-4 justify-center relative z-10">
                    <a
                      href="/sample-transactions.csv"
                      download
                      className="text-sm text-muted-foreground underline hover:text-foreground min-h-[44px] inline-flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download template CSV
                    </a>
                  </div>
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
                onClick={() => setStep("target")}
                className="min-h-[44px] w-full sm:w-auto"
              >
                Continue - Select Target Table
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 2: Select Target Table ──────────────────────────────── */}
      {step === "target" && (
        <div>
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              <h3 className="font-medium text-foreground mb-1">
                What type of data is in this file?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select the table that matches your CSV data. AI will map your
                columns to the right fields.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {TARGET_TABLE_LIST.map((t) => (
                  <TargetTableCard
                    key={t.key}
                    tableKey={t.key}
                    selected={targetTable === t.key}
                    onSelect={() => setTargetTable(t.key)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

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
              onClick={startMapping}
              className="min-h-[44px] w-full sm:w-auto"
            >
              <Sparkles size={16} className="mr-2" />
              Continue - Map Columns with AI
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Column Mapping ─────────────────────────────────── */}
      {step === "mapping" && (
        <div>
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              {isMappingLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2
                    size={32}
                    className="animate-spin text-muted-foreground mb-4"
                  />
                  <p className="text-foreground font-medium">
                    Analyzing your data...
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI is detecting column types for{" "}
                    <span className="font-medium">{tableDef.label}</span> from
                    your headers and sample data
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileSpreadsheet
                      size={20}
                      className="text-muted-foreground"
                    />
                    <h3 className="font-medium text-foreground">
                      Map your CSV columns to {tableDef.label} fields
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    AI has suggested mappings. Adjust any that look incorrect.
                  </p>

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
                              {tableDef.fields.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                  {f.required ? " (required)" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Show sample value */}
                        {parsedData && parsedData.rows[0] && (
                          <span className="text-xs text-muted-foreground truncate max-w-[150px] hidden lg:block">
                            e.g. &quot;{parsedData.rows[0][idx]}&quot;
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Missing required field warnings */}
                  {missingRequired.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                      <AlertCircle
                        size={16}
                        className="text-yellow-600 mt-0.5 flex-shrink-0"
                      />
                      <p className="text-sm text-yellow-800">
                        Missing required field
                        {missingRequired.length > 1 ? "s" : ""}:{" "}
                        <span className="font-medium">
                          {missingRequired.join(", ")}
                        </span>
                        . These must be mapped to proceed.
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
                onClick={() => setStep("target")}
                className="min-h-[44px] w-full sm:w-auto"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <Button
                onClick={startPreview}
                disabled={missingRequired.length > 0}
                className="min-h-[44px] w-full sm:w-auto"
              >
                Continue - Preview & Validate
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── Step 4: Preview & Validate ───────────────────────────────── */}
      {step === "preview" && (
        <div>
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-foreground">
                    Preview: {mappedRows.length} {tableDef.label.toLowerCase()}{" "}
                    ready to import
                  </h3>
                  {hasValidationErrors && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.length} validation error
                      {validationErrors.length > 1 ? "s" : ""} found across{" "}
                      {errorRowSet.size} row
                      {errorRowSet.size > 1 ? "s" : ""}. Rows with errors will
                      still be attempted.
                    </p>
                  )}
                  {!hasValidationErrors && (
                    <p className="text-sm text-green-700 mt-1">
                      All rows passed validation.
                    </p>
                  )}
                </div>
              </div>

              {/* Validation error summary */}
              {hasValidationErrors && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Validation Errors
                  </h4>
                  <ul className="space-y-1">
                    {validationErrors.slice(0, 10).map((err, i) => (
                      <li
                        key={`verr-${i}`}
                        className="text-xs text-red-700"
                      >
                        Row {err.row + 1}: {err.message}
                      </li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="text-xs text-red-700 font-medium">
                        ...and {validationErrors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Data preview table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary border-b border-border">
                        <th className="px-3 py-2 text-left font-medium text-foreground whitespace-nowrap w-10">
                          #
                        </th>
                        {tableDef.previewColumns.map((col) => {
                          const fieldDef = tableDef.fields.find(
                            (f) => f.value === col,
                          );
                          return (
                            <th
                              key={col}
                              className="px-3 py-2 text-left font-medium text-foreground whitespace-nowrap"
                            >
                              {fieldDef?.label || col}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {mappedRows.slice(0, 10).map((row) => {
                        const rowHasError = errorRowSet.has(row._rowIndex);
                        return (
                          <tr
                            key={`prev-${row._rowIndex}`}
                            className={`border-b border-border last:border-0 ${
                              rowHasError ? "bg-red-50" : ""
                            }`}
                          >
                            <td className="px-3 py-2 text-muted-foreground text-xs">
                              {row._rowIndex + 1}
                            </td>
                            {tableDef.previewColumns.map((col) => {
                              const val = String(row[col] ?? "");
                              const colErrors = validationErrors.filter(
                                (e) =>
                                  e.row === row._rowIndex && e.field === col,
                              );
                              return (
                                <td
                                  key={`${row._rowIndex}-${col}`}
                                  className={`px-3 py-2 whitespace-nowrap max-w-[200px] truncate ${
                                    colErrors.length > 0
                                      ? "text-red-700 font-medium"
                                      : "text-muted-foreground"
                                  }`}
                                  title={
                                    colErrors.length > 0
                                      ? colErrors.map((e) => e.message).join("; ")
                                      : val
                                  }
                                >
                                  {val || (
                                    <span className="text-muted-foreground/50 italic">
                                      empty
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {mappedRows.length > 10 && (
                  <div className="px-3 py-2 bg-secondary text-xs text-muted-foreground text-center border-t border-border">
                    Showing 10 of {mappedRows.length} rows. All will be
                    imported.
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
              className="min-h-[44px] w-full sm:w-auto"
            >
              Import {mappedRows.length} {tableDef.label}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 5: Import & Results ─────────────────────────────────── */}
      {step === "importing" && (
        <div>
          <Card className="mb-6">
            <CardContent className="p-6 sm:p-8">
              {!importResult ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2
                    size={32}
                    className="animate-spin text-muted-foreground mb-4"
                  />
                  <p className="text-foreground font-medium mb-4">
                    Importing {tableDef.label.toLowerCase()}...
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
                  {importResult.errors.length === 0 ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <CheckCircle size={24} className="text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-1">
                        Import Complete
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Successfully imported {importResult.importedCount}{" "}
                        {tableDef.label.toLowerCase()}.
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
                        {importResult.importedCount > 0
                          ? `Imported ${importResult.importedCount} of ${importTotal} ${tableDef.label.toLowerCase()}.`
                          : `No ${tableDef.label.toLowerCase()} were imported.`}
                      </p>
                      <div className="w-full max-w-md space-y-2">
                        {importResult.errors.map((err, i) => (
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
                      onClick={resetWizard}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      Import Another File
                    </Button>
                    <Button
                      onClick={() => {
                        const routes: Record<TargetTableKey, string> = {
                          transactions: "/transactions",
                          locations: "/locations",
                          machines: "/machines",
                          employees: "/employees",
                          skus: "/skus",
                        };
                        router.push(routes[targetTable]);
                      }}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      View {tableDef.label}
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
