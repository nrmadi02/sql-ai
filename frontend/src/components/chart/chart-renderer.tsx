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
  resolveChartSeries,
  transformQueryResultForChart,
} from "@/lib/chart-utils";
import type { QueryExecutionResponse } from "@/lib/types";

type ChartRendererProps = {
  result: QueryExecutionResponse;
  config: ChartAxisConfig;
  className?: string;
};

function ChartRenderer({ result, config, className }: ChartRendererProps) {
  const rawData = transformQueryResultForChart(result, config);
  const { chartData, seriesKeys } = resolveChartSeries(rawData, config);
  const chartConfig = buildChartContainerConfig(seriesKeys, config.visualConfig);
  const primaryYAxis = seriesKeys[0];
  const colors = seriesKeys.map(
    (column) => chartConfig[column]?.color ?? "var(--chart-1)",
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

  if (config.chartType === "pie") {
    return (
      <ChartContainer config={chartConfig} className={className}>
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => tooltipFormatter(value as number)}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey={primaryYAxis}
            nameKey={config.xAxisColumn}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={96}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={String(entry[config.xAxisColumn])}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey={primaryYAxis} />}
          />
        </PieChart>
      </ChartContainer>
    );
  }

  const sharedAxes = (
    <>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis
        dataKey={config.xAxisColumn}
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

  if (config.chartType === "line") {
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

  if (config.chartType === "area") {
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
              stackId={config.categoryColumn ? "chart-stack" : undefined}
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
        {seriesKeys.map((column) => (
          <Bar
            key={column}
            dataKey={column}
            fill={`var(--color-${column})`}
            radius={[4, 4, 0, 0]}
            stackId={config.categoryColumn ? "chart-stack" : undefined}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

export { ChartRenderer };
