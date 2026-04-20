/**
 * Minimal CSV serialization utility.
 * Headers drive column order. Unknown keys produce empty cells.
 * Values with commas, quotes, or newlines are wrapped in double-quotes per RFC 4180.
 */
export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  function escape(val: unknown): string {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];

  return lines.join("\r\n");
}

export function exportFilename(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${date}.csv`;
}
