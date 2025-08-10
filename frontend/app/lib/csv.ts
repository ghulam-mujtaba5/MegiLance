// @AI-HINT: Utility helpers for generating and downloading CSV files consistently across pages.
export function toCSV(headers: string[], rows: (string | number | boolean)[][]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers, ...rows]
    .map(cols => cols.map(esc).join(','))
    .join('\n');
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(headers: string[], rows: (string | number | boolean)[][], filename: string) {
  const csv = toCSV(headers, rows);
  downloadCSV(csv, filename);
}
