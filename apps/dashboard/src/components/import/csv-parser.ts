// ─── CSV / TSV Parser ─────────────────────────────────────────────────────────
// Handles quoted fields, escaped quotes, and auto-detects tab vs comma.

export interface ParsedData {
  headers: string[];
  rows: string[][];
}

export function parseCSV(text: string): ParsedData {
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
        i++;
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
          i++;
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

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
