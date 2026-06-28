import { formatCellValue, rowsToRecords } from "@/lib/query-utils";
import type {
  ChartColorPalette,
  ChartHints,
  ChartSuggestResult,
  ChartType,
  ChartVisualConfig,
  QueryColumn,
  QueryExecutionResponse,
} from "@/lib/types";

const LARGE_DATASET_ROW_THRESHOLD = 100;

const TEMPORAL_TYPE_HINTS = ["date", "time", "timestamp"] as const;

const NUMERIC_TYPE_HINTS = [
  "int",
  "float",
  "double",
  "decimal",
  "numeric",
  "bigint",
  "real",
  "money",
  "number",
] as const;

const LABEL_TYPE_HINTS = [
  "char",
  "text",
  "uuid",
  "json",
  "bool",
  "bytea",
  "blob",
  "string",
] as const;

export const CHART_PALETTE_COLORS: Record<ChartColorPalette, string[]> = {
  default: [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ],
  warm: [
    "oklch(0.7049 0.1867 47.6044)",
    "oklch(0.6450 0.2154 16.4393)",
    "oklch(0.7599 0.1368 61.0595)",
    "oklch(0.6668 0.2591 322.1499)",
    "oklch(0.6056 0.2189 292.7172)",
  ],
  cool: [
    "oklch(0.4691 0.2225 262.4817)",
    "oklch(0.6056 0.2189 292.7172)",
    "oklch(0.6199 0.1907 271.3978)",
    "oklch(0.3395 0.1557 273.0758)",
    "oklch(0.6668 0.2591 322.1499)",
  ],
  mono: [
    "oklch(0.45 0.02 280)",
    "oklch(0.55 0.02 280)",
    "oklch(0.65 0.02 280)",
    "oklch(0.75 0.02 280)",
    "oklch(0.35 0.02 280)",
  ],
};

export type ChartAxisConfig = {
  chartType: ChartType;
  xAxisColumn: string;
  yAxisColumns: string[];
  categoryColumn?: string;
  visualConfig?: ChartVisualConfig;
};

export function isNumericColumnType(type: string): boolean {
  const normalized = type.toLowerCase();
  return NUMERIC_TYPE_HINTS.some((hint) => normalized.includes(hint));
}

export function isLabelColumnType(type: string): boolean {
  const normalized = type.trim().toLowerCase();
  if (!normalized) return false;
  return LABEL_TYPE_HINTS.some((hint) => normalized.includes(hint));
}

export function isTemporalColumnType(type: string): boolean {
  const normalized = type.toLowerCase();
  return TEMPORAL_TYPE_HINTS.some((hint) => normalized.includes(hint));
}

export function looksLikeIDColumn(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return normalized === "id" || normalized.endsWith("_id");
}

function coerceNumericValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "boolean") return value ? 1 : 0;

  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && String(value).trim() !== "") {
    return asNumber;
  }

  return null;
}

function columnHasChartableNumericValues(
  rows: unknown[][],
  columnIndex: number,
): boolean {
  if (!rows.length) return true;

  const sampleSize = Math.min(rows.length, 20);
  let validCount = 0;

  for (let rowIndex = 0; rowIndex < sampleSize; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!Array.isArray(row) || columnIndex >= row.length) continue;
    if (coerceNumericValue(row[columnIndex]) !== null) {
      validCount += 1;
    }
  }

  return validCount > 0;
}

export function findChartableNumericColumns(
  columns: QueryColumn[],
  rows: unknown[][],
): string[] {
  return columns
    .filter((column, index) => isChartableNumericColumn(column, rows, index))
    .map((column) => column.name);
}

function isChartableNumericColumn(
  column: QueryColumn,
  rows: unknown[][],
  columnIndex: number,
): boolean {
  if (looksLikeIDColumn(column.name)) return false;
  if (isTemporalColumnType(column.type)) return false;
  if (!columnHasChartableNumericValues(rows, columnIndex)) return false;
  if (isNumericColumnType(column.type)) return true;
  if (isLabelColumnType(column.type)) return false;
  return true;
}

function findLabelColumns(
  columns: QueryColumn[],
  numericColumns: string[],
): string[] {
  const numericSet = new Set(
    numericColumns.map((column) => column.toLowerCase()),
  );
  return columns
    .filter((column) => !numericSet.has(column.name.toLowerCase()))
    .map((column) => column.name);
}

function findTemporalColumn(columns: QueryColumn[]): string {
  const typed = columns.find((column) => isTemporalColumnType(column.type));
  if (typed) return typed.name;

  return (
    columns.find((column) => {
      const name = column.name.toLowerCase();
      return (
        name.includes("date") ||
        name.includes("time") ||
        name.includes("tanggal") ||
        name.includes("bulan") ||
        name.includes("tahun")
      );
    })?.name ?? ""
  );
}

function firstNonIDColumn(columns: string[]): string {
  return columns.find((column) => !looksLikeIDColumn(column)) ?? "";
}

function firstMeaningfulNumericColumn(columns: string[]): string {
  return firstNonIDColumn(columns) || columns[0] || "";
}

function uniqueSuggestions(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const text = item.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }

  return result;
}

function buildSuggestedAggregations(
  columns: QueryColumn[],
  labelColumns: string[],
  numericColumns: string[],
): string[] {
  const suggestions: string[] = [];
  const primaryLabel = firstNonIDColumn(labelColumns) || columns[0]?.name || "";
  const temporalColumn = findTemporalColumn(columns);
  const primaryNumeric = firstMeaningfulNumericColumn(numericColumns);

  if (temporalColumn) {
    suggestions.push(`Hitung jumlah baris per ${temporalColumn}`);
  }

  if (primaryLabel) {
    suggestions.push(`Hitung jumlah baris per ${primaryLabel}`);
  }

  if (primaryLabel && primaryNumeric) {
    suggestions.push(`Hitung total ${primaryNumeric} per ${primaryLabel}`);
  }

  if (!suggestions.length) {
    suggestions.push(
      "Kelompokkan data dengan GROUP BY dan fungsi agregasi COUNT/SUM",
    );
  }

  return uniqueSuggestions(suggestions);
}

function buildSuggestedFilters(
  columns: QueryColumn[],
  numericColumns: string[],
  rowCount: number,
): string[] {
  const suggestions: string[] = [];
  const primaryNumeric = firstMeaningfulNumericColumn(numericColumns);
  const temporalColumn = findTemporalColumn(columns);

  if (primaryNumeric) {
    suggestions.push(`Tampilkan Top 10 berdasarkan ${primaryNumeric}`);
  }

  if (temporalColumn) {
    suggestions.push(`Kelompokkan data per ${temporalColumn}`);
  }

  suggestions.push(`Batasi hasil ke 50 baris dari ${rowCount} baris`);

  return uniqueSuggestions(suggestions);
}

export function analyzeChartDataset(
  columns: QueryColumn[],
  rows: unknown[][],
  rowCount = rows.length,
): ChartSuggestResult {
  const numericColumns = findChartableNumericColumns(columns, rows);
  const labelColumns = findLabelColumns(columns, numericColumns);
  const chartable = numericColumns.length > 0;
  const largeDataset = rowCount > LARGE_DATASET_ROW_THRESHOLD;

  return {
    chartable,
    large_dataset: largeDataset,
    numeric_columns: numericColumns,
    label_columns: labelColumns,
    suggested_aggregations: chartable
      ? []
      : buildSuggestedAggregations(columns, labelColumns, numericColumns),
    suggested_filters: largeDataset
      ? buildSuggestedFilters(columns, numericColumns, rowCount)
      : [],
  };
}

export function mergeChartHints(
  analysis: ChartSuggestResult,
  hints?: ChartHints,
): ChartSuggestResult {
  if (!hints) return analysis;

  const chartable = hints.chartable ?? analysis.chartable;

  return {
    chartable,
    large_dataset: hints.large_dataset ?? analysis.large_dataset,
    numeric_columns: analysis.numeric_columns,
    label_columns: analysis.label_columns,
    suggested_aggregations: chartable
      ? []
      : uniqueSuggestions([
          ...(hints.suggested_aggregations ?? []),
          ...analysis.suggested_aggregations,
        ]),
    suggested_filters: analysis.large_dataset
      ? uniqueSuggestions([
          ...(hints.suggested_filters ?? []),
          ...analysis.suggested_filters,
        ])
      : [],
  };
}

export function buildChartRecommendationMessage(suggestion: string): string {
  return `Tolong ubah query SQL sebelumnya agar hasilnya bisa divisualisasikan sebagai grafik. Rekomendasi: ${suggestion}`;
}

export function resolvePieSliceColors(
  sliceCount: number,
  visualConfig?: ChartVisualConfig,
): string[] {
  const palette =
    CHART_PALETTE_COLORS[visualConfig?.color_palette ?? "default"];
  return Array.from({ length: sliceCount }, (_, index) => {
    return palette[index % palette.length];
  });
}

export function normalizeChartAxisConfig(
  config: ChartAxisConfig,
  columns: QueryColumn[],
  rows: unknown[][],
): ChartAxisConfig {
  const numericColumnNames = findChartableNumericColumns(columns, rows);
  const numericSet = new Set(
    numericColumnNames.map((column) => column.toLowerCase()),
  );

  const xIsNumeric = numericSet.has(config.xAxisColumn.toLowerCase());
  const primaryYAxis = config.yAxisColumns[0] ?? "";
  const yIsLabel =
    primaryYAxis.length > 0 && !numericSet.has(primaryYAxis.toLowerCase());

  if (xIsNumeric && yIsLabel) {
    return {
      ...config,
      xAxisColumn: primaryYAxis,
      yAxisColumns: [config.xAxisColumn],
    };
  }

  if (
    config.chartType === "pie" &&
    xIsNumeric &&
    config.yAxisColumns.every((column) =>
      numericSet.has(column.toLowerCase()),
    )
  ) {
    const labelColumn = columns.find(
      (column) => !numericSet.has(column.name.toLowerCase()),
    );
    if (labelColumn) {
      return {
        ...config,
        xAxisColumn: labelColumn.name,
        yAxisColumns: [config.xAxisColumn],
      };
    }
  }

  return config;
}

export function suggestChartDefaults(
  columns: QueryColumn[],
  rows: unknown[][] = [],
  suggestedChart?: ChartHints["suggested_chart"],
): ChartAxisConfig {
  if (suggestedChart) {
    const chartType = suggestedChart.chart_type;
    const xAxisColumn = suggestedChart.x_axis_column?.trim() ?? "";
    const yAxisColumns = (suggestedChart.y_axis_columns ?? []).filter(Boolean);
    const categoryColumn = suggestedChart.category_column ?? "";

    if (xAxisColumn && yAxisColumns.length > 0) {
      return {
        chartType:
          chartType === "line" ||
          chartType === "pie" ||
          chartType === "area" ||
          chartType === "bar"
            ? chartType
            : "bar",
        xAxisColumn,
        yAxisColumns,
        categoryColumn: categoryColumn || "",
        visualConfig: { color_palette: "default" },
      };
    }
  }

  if (!columns.length) {
    return {
      chartType: "bar",
      xAxisColumn: "",
      yAxisColumns: [],
      categoryColumn: "",
      visualConfig: { color_palette: "default" },
    };
  }

  const numericColumnNames = findChartableNumericColumns(columns, rows);
  const numericSet = new Set(
    numericColumnNames.map((column) => column.toLowerCase()),
  );
  const labelColumns = columns.filter(
    (column) => !numericSet.has(column.name.toLowerCase()),
  );

  const xAxisColumn = labelColumns[0]?.name ?? columns[0].name;
  const yAxisColumn =
    numericColumnNames[0] ??
    columns.find((column) => column.name !== xAxisColumn)?.name ??
    columns[0].name;

  return {
    chartType: "bar",
    xAxisColumn,
    yAxisColumns: yAxisColumn ? [yAxisColumn] : [],
    categoryColumn: "",
    visualConfig: { color_palette: "default" },
  };
}

export function formatChartAxisNumber(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    const scaled = value / 1_000_000_000;
    return `${scaled.toLocaleString("id-ID", { maximumFractionDigits: 1 })}M`;
  }

  if (abs >= 1_000_000) {
    const scaled = value / 1_000_000;
    return `${scaled.toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`;
  }

  if (abs >= 1_000) {
    const scaled = value / 1_000;
    return `${scaled.toLocaleString("id-ID", { maximumFractionDigits: 1 })}rb`;
  }

  return value.toLocaleString("id-ID", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

export function coerceChartValue(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value ? 1 : 0;

  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && String(value).trim() !== "") {
    return asNumber;
  }

  return formatCellValue(value);
}

export function transformQueryResultForChart(
  result: QueryExecutionResponse,
  config: ChartAxisConfig,
): Record<string, string | number | null>[] {
  const records = rowsToRecords(result.columns, result.rows);

  return records.map((record) => {
    const next: Record<string, string | number | null> = {};

    for (const column of result.columns) {
      next[column.name] = coerceChartValue(record[column.name]);
    }

    if (config.categoryColumn) {
      next[config.categoryColumn] = coerceChartValue(
        record[config.categoryColumn],
      );
    }

    return next;
  });
}

export function isChartConfigValid(config: ChartAxisConfig): boolean {
  return Boolean(
    config.xAxisColumn.trim() &&
      config.yAxisColumns.length > 0 &&
      config.yAxisColumns.every((column) => column.trim()),
  );
}

export function resolveSeriesColors(
  yAxisColumns: string[],
  visualConfig?: ChartVisualConfig,
): Record<string, string> {
  const palette =
    CHART_PALETTE_COLORS[visualConfig?.color_palette ?? "default"];
  const colors: Record<string, string> = {};

  for (const [index, column] of yAxisColumns.entries()) {
    colors[column] =
      visualConfig?.colors?.[column] ?? palette[index % palette.length];
  }

  return colors;
}

export function buildChartContainerConfig(
  yAxisColumns: string[],
  visualConfig?: ChartVisualConfig,
) {
  const colors = resolveSeriesColors(yAxisColumns, visualConfig);
  return Object.fromEntries(
    yAxisColumns.map((column) => [
      column,
      {
        label: column,
        color: colors[column],
      },
    ]),
  );
}

export function exportChartDataToCsv(
  data: Record<string, string | number | null>[],
  columns: string[],
  filename = "grafik-data.csv",
): void {
  if (!data.length) return;

  const header = columns.join(",");
  const body = data
    .map((row) =>
      columns
        .map((column) => {
          const value = row[column];
          if (value === null || value === undefined) return "";
          const text = String(value);
          return text.includes(",") || text.includes('"')
            ? `"${text.replaceAll('"', '""')}"`
            : text;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([`${header}\n${body}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getChartExportColumns(config: ChartAxisConfig): string[] {
  const columns = [config.xAxisColumn, ...config.yAxisColumns];
  if (config.categoryColumn) {
    columns.push(config.categoryColumn);
  }
  return [...new Set(columns.filter(Boolean))];
}

export type PivotedChartData = {
  data: Record<string, string | number | null>[];
  seriesKeys: string[];
};

export function pivotChartDataByCategory(
  data: Record<string, string | number | null>[],
  config: ChartAxisConfig,
): PivotedChartData | null {
  const categoryColumn = config.categoryColumn?.trim();
  const primaryYAxis = config.yAxisColumns[0];

  if (!categoryColumn || !primaryYAxis) {
    return null;
  }

  const categories = [
    ...new Set(
      data
        .map((row) => formatCellValue(row[categoryColumn]))
        .filter((value) => value && value !== "NULL"),
    ),
  ];

  if (!categories.length) {
    return null;
  }

  const xValues = [
    ...new Set(
      data
        .map((row) => formatCellValue(row[config.xAxisColumn]))
        .filter((value) => value && value !== "NULL"),
    ),
  ];

  const pivoted = xValues.map((xValue) => {
    const row: Record<string, string | number | null> = {
      [config.xAxisColumn]: xValue,
    };

    for (const category of categories) {
      const match = data.find(
        (item) =>
          formatCellValue(item[config.xAxisColumn]) === xValue &&
          formatCellValue(item[categoryColumn]) === category,
      );
      row[category] = match?.[primaryYAxis] ?? null;
    }

    return row;
  });

  return { data: pivoted, seriesKeys: categories };
}

export function resolveChartSeries(
  data: Record<string, string | number | null>[],
  config: ChartAxisConfig,
): {
  chartData: Record<string, string | number | null>[];
  seriesKeys: string[];
} {
  const pivoted = pivotChartDataByCategory(data, config);
  if (pivoted) {
    return {
      chartData: pivoted.data,
      seriesKeys: pivoted.seriesKeys,
    };
  }

  return {
    chartData: data,
    seriesKeys: config.yAxisColumns,
  };
}
