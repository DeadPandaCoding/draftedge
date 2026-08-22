/**
 * Minimal, dependency-free CSV parser. Handles quoted fields (including
 * embedded commas, quotes, and newlines) and CRLF line endings. Used to ingest
 * nflverse data files, which are plain CSVs with occasional quoted values.
 */

/** Parse raw CSV text into a 2D array of strings (rows × fields). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip — CRLF is normalized to \n
    } else {
      field += c;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Convert parsed rows into records keyed by the header row. */
export function csvToRecords(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 0 || (r.length === 1 && r[0] === "")) continue;
    const rec: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      rec[header[j]] = r[j] ?? "";
    }
    out.push(rec);
  }
  return out;
}

/** Coerce a CSV cell to a number, returning 0 for missing/NA/empty values. */
export function cellNumber(value: string | undefined): number {
  if (value == null) return 0;
  const t = value.trim();
  if (t === "" || t.toUpperCase() === "NA" || t.toUpperCase() === "N/A") return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}
