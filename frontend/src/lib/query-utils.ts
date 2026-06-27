import { errors } from "@/lib/microcopy";
import type { QueryColumn, QueryExecutionResponse } from "@/lib/types";

export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function parseStoredResult(
  value: unknown,
): QueryExecutionResponse | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Partial<QueryExecutionResponse>;
  if (!Array.isArray(record.columns) || !Array.isArray(record.rows)) {
    return null;
  }

  return {
    columns: record.columns,
    rows: record.rows,
    row_count: record.row_count ?? record.rows.length,
    execution_time_ms: record.execution_time_ms ?? 0,
    truncated: record.truncated ?? false,
  };
}

export function normalizeQueryError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("timeout") || normalized.includes("terlalu lama")) {
    return errors.timeout;
  }
  if (
    normalized.includes("tidak diizinkan") ||
    normalized.includes("forbidden")
  ) {
    return errors.forbiddenKeyword;
  }
  return message;
}

export function previewSql(sql: string, maxLines = 3): string {
  const lines = sql.trim().split("\n");
  if (lines.length <= maxLines) return sql.trim();
  return `${lines.slice(0, maxLines).join("\n")}\n…`;
}

export function rowsToRecords(
  columns: QueryColumn[],
  rows: unknown[][],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const record: Record<string, unknown> = {};
    for (const [index, column] of columns.entries()) {
      record[column.name] = row[index];
    }
    return record;
  });
}
