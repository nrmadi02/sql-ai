"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  buildChartContainerConfig,
  type ChartAxisConfig,
  formatChartAxisNumber,
  normalizeChartAxisConfig,
  resolveChartSeries,
  resolvePieSliceColors,
  transformQueryResultForChart,
} from "@/lib/chart-utils";
import type { QueryExecutionResponse } from "@/lib/types";

type ChartRendererProps = {
  result: QueryExecutionResponse;
  config: ChartAxisConfig;
  className?: string;
};

function ChartRenderer({ result, config, className }: ChartRendererProps) {
  const axisConfig = normalizeChartAxisConfig(
    config,
    result.columns,
    result.rows,
  );
  const rawData = transformQueryResultForChart(result, axisConfig);
  const { chartData, seriesKeys } = resolveChartSeries(rawData, axisConfig);
  const chartConfig = buildChartContainerConfig(seriesKeys, axisConfig.visualConfig);
  const primaryYAxis = axisConfig.yAxisColumns[0] ?? seriesKeys[0];
  const sliceLabelKey = axisConfig.xAxisColumn;
  const seriesColors = seriesKeys.map(
    (column) => chartConfig[column]?.color ?? "var(--chart-1)",
  );
  const pieSliceColors = resolvePieSliceColors(
    chartData.length,
    axisConfig.visualConfig,
  );

  if (!primaryYAxis) {
    return null;
  }

  const tooltipFormatter = (value: number | string) => {
    if (typeof value === "number") {
      return formatChartAxisNumber(value);
    }
    return String(value);
  };

  if (axisConfig.chartType === "pie") {
    return (
      <ChartContainer config={chartConfig} className={className}>
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey={sliceLabelKey}
                formatter={(value, name) => (
                  <span className="font-mono">
                    {String(name)}: {tooltipFormatter(value as number)}
                  </span>
                )}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey={primaryYAxis}
            nameKey={sliceLabelKey}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={96}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`${String(entry[sliceLabelKey])}-${index}`}
                fill={pieSliceColors[index % pieSliceColors.length]}
              />
            ))}
          </Pie>
          <ChartLegend
            verticalAlign="bottom"
            content={({ payload }) => (
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-3">
                {payload?.map((entry, index) => (
                  <div
                    key={`${entry.value}-${index}`}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="size-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-muted-foreground">
                      {String(entry.value ?? "")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          />
        </PieChart>
      </ChartContainer>
    );
  }

  const sharedAxes = (
    <>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis
        dataKey={axisConfig.xAxisColumn}
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={24}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        tickFormatter={(value) => formatChartAxisNumber(Number(value))}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            formatter={(value) => tooltipFormatter(value as number)}
          />
        }
      />
      <ChartLegend content={<ChartLegendContent />} />
    </>
  );

  if (axisConfig.chartType === "line") {
    return (
      <ChartContainer config={chartConfig} className={className}>
        <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
          {sharedAxes}
          {seriesKeys.map((column) => (
            <Line
              key={column}
              type="monotone"
              dataKey={column}
              stroke={`var(--color-${column})`}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
    );
  }

  if (axisConfig.chartType === "area") {
    return (
      <ChartContainer config={chartConfig} className={className}>
        <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
          {sharedAxes}
          {seriesKeys.map((column) => (
            <Area
              key={column}
              type="monotone"
              dataKey={column}
              stroke={`var(--color-${column})`}
              fill={`var(--color-${column})`}
              fillOpacity={0.22}
              strokeWidth={2}
              stackId={axisConfig.categoryColumn ? "chart-stack" : undefined}
            />
        ))}
      </AreaChart>
    </ChartContainer>
    );
  }

  return (
    <ChartContainer config={chartConfig} className={className}>
      <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
        {sharedAxes}
        {seriesKeys.map((column, index) => (
          <Bar
            key={column}
            dataKey={column}
            fill={seriesColors[index % seriesColors.length]}
            radius={[4, 4, 0, 0]}
            stackId={axisConfig.categoryColumn ? "chart-stack" : undefined}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

export { ChartRenderer };
