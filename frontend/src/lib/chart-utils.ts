import { formatCellValue, rowsToRecords } from "@/lib/query-utils";
import type {
  ChartColorPalette,
  ChartType,
  ChartVisualConfig,
  QueryColumn,
  QueryExecutionResponse,
} from "@/lib/types";

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

export function suggestChartDefaults(columns: QueryColumn[]): ChartAxisConfig {
  if (!columns.length) {
    return {
      chartType: "bar",
      xAxisColumn: "",
      yAxisColumns: [],
      categoryColumn: "",
      visualConfig: { color_palette: "default" },
    };
  }

  const numericColumns = columns.filter((column) =>
    isNumericColumnType(column.type),
  );
  const labelColumns = columns.filter(
    (column) => !isNumericColumnType(column.type),
  );

  const xAxisColumn = labelColumns[0]?.name ?? columns[0].name;
  const yAxisColumn =
    numericColumns[0]?.name ??
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
