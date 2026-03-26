/**
 * Export data to a CSV file and trigger a browser download.
 *
 * @param filename - Name for the downloaded file (without extension)
 * @param rows - Array of row objects to export
 * @param columns - Optional column definitions. When omitted, keys from the first row are used.
 */
export function exportToCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: { key: string; header: string }[],
): void {
  if (rows.length === 0) return;

  const headers = columns
    ? columns.map((c) => c.header)
    : Object.keys(rows[0] ?? {});
  const keys = columns
    ? columns.map((c) => c.key)
    : Object.keys(rows[0] ?? {});

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      keys
        .map((k) => {
          const val = row[k];
          const str = val == null ? "" : String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(","),
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
