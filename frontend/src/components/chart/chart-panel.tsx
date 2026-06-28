"use client";

import {
  Analytics01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  TableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ChartConfigForm } from "@/components/chart/chart-config";
import { ChartRenderer } from "@/components/chart/chart-renderer";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  useChartConfigs,
  useCreateChartConfig,
  useUpdateChartConfig,
} from "@/hooks/use-chart";
import {
  exportChartDataToCsv,
  getChartExportColumns,
  isChartConfigValid,
  suggestChartDefaults,
  transformQueryResultForChart,
  type ChartAxisConfig,
} from "@/lib/chart-utils";
import { chart } from "@/lib/microcopy";
import type {
  ChartConfigRecord,
  ChartReferenceFilter,
  ChartType,
  QueryExecutionResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type ChartPanelProps = {
  result: QueryExecutionResponse;
  className?: string;
  tableView: ReactNode;
  generatorMessageId?: string;
  sqlEditorTabId?: string;
  savedQueryId?: string;
};

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: chart.typeBar },
  { value: "line", label: chart.typeLine },
  { value: "pie", label: chart.typePie },
  { value: "area", label: chart.typeArea },
];

function recordToAxisConfig(record: ChartConfigRecord): ChartAxisConfig {
  return {
    chartType: record.chart_type,
    xAxisColumn: record.x_axis_column,
    yAxisColumns: record.y_axis_columns,
    categoryColumn: record.category_column ?? "",
    visualConfig: record.config ?? { color_palette: "default" },
  };
}

function axisConfigToPayload(config: ChartAxisConfig) {
  return {
    chart_type: config.chartType,
    x_axis_column: config.xAxisColumn,
    y_axis_columns: config.yAxisColumns,
    category_column: config.categoryColumn || undefined,
    config: config.visualConfig ?? { color_palette: "default" },
  };
}

function ChartPanel({
  result,
  className,
  tableView,
  generatorMessageId,
  sqlEditorTabId,
  savedQueryId,
}: ChartPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("table");
  const [configOpen, setConfigOpen] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartAxisConfig>(() =>
    suggestChartDefaults(result.columns),
  );

  const referenceFilter = useMemo<ChartReferenceFilter>(
    () => ({
      saved_query_id: savedQueryId,
      generator_message_id: generatorMessageId,
      sql_editor_tab_id: sqlEditorTabId,
    }),
    [savedQueryId, generatorMessageId, sqlEditorTabId],
  );

  const canPersist = Boolean(
    referenceFilter.saved_query_id ||
      referenceFilter.generator_message_id ||
      referenceFilter.sql_editor_tab_id,
  );

  const chartConfigsQuery = useChartConfigs(referenceFilter, canPersist);
  const createChart = useCreateChartConfig();
  const updateChart = useUpdateChartConfig(configId ?? "");
  const isSaving = createChart.isPending || updateChart.isPending;

  useEffect(() => {
    if (chartConfigsQuery.isLoading) return;

    const saved = chartConfigsQuery.data?.[0];
    if (saved) {
      setConfigId(saved.id);
      setChartConfig(recordToAxisConfig(saved));
      return;
    }

    setConfigId(null);
    setChartConfig(suggestChartDefaults(result.columns));
  }, [chartConfigsQuery.data, chartConfigsQuery.isLoading, result.columns]);

  const handleSave = useCallback(async () => {
    if (!isChartConfigValid(chartConfig) || !canPersist) return;

    const payload = axisConfigToPayload(chartConfig);

    if (configId) {
      await updateChart.mutateAsync(payload);
      return;
    }

    const created = await createChart.mutateAsync({
      ...referenceFilter,
      ...payload,
    });
    setConfigId(created.id);
  }, [
    canPersist,
    chartConfig,
    configId,
    createChart,
    referenceFilter,
    updateChart,
  ]);

  const handleExportPng = useCallback(async () => {
    if (!chartRef.current) return;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `grafik-${chartConfig.chartType}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(chart.exportPngSuccess);
    } catch {
      toast.error(chart.exportFailed);
    }
  }, [chartConfig.chartType]);

  const handleExportCsv = useCallback(() => {
    if (!isChartConfigValid(chartConfig)) {
      toast.error(chart.invalidConfig);
      return;
    }

    const data = transformQueryResultForChart(result, chartConfig);
    const columns = getChartExportColumns(chartConfig);
    exportChartDataToCsv(data, columns);
    toast.success(chart.exportCsvSuccess);
  }, [chartConfig, result]);

  const chartReady = isChartConfigValid(chartConfig);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
          <TabsList variant="line" className="h-8 bg-transparent p-0">
            <TabsTrigger value="table" className="gap-1.5 px-3">
              <HugeiconsIcon icon={TableIcon} strokeWidth={2} />
              {chart.tabTable}
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-1.5 px-3">
              <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} />
              {chart.tabChart}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="table"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {tableView}
        </TabsContent>

        <TabsContent
          value="chart"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        >
          <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
            <div className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-card/95 px-3 py-2 backdrop-blur-sm">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Label className="sr-only">{chart.typeLabel}</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  value={chartConfig.chartType}
                  onValueChange={(value) => {
                    if (value) {
                      setChartConfig((current) => ({
                        ...current,
                        chartType: value as ChartType,
                      }));
                    }
                  }}
                  className="flex flex-wrap justify-start"
                >
                  {CHART_TYPES.map((item) => (
                    <ToggleGroupItem
                      key={item.value}
                      value={item.value}
                      className="px-2.5 font-mono text-xs"
                    >
                      {item.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" size="xs">
                    <HugeiconsIcon
                      icon={configOpen ? ArrowUp01Icon : ArrowDown01Icon}
                      strokeWidth={2}
                    />
                    {configOpen
                      ? chart.configureHide
                      : chart.configureToggle}
                  </Button>
                </CollapsibleTrigger>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => void handleExportPng()}
                >
                  {chart.exportPng}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleExportCsv}
                >
                  {chart.exportCsv}
                </Button>
                {canPersist ? (
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                  >
                    {isSaving ? chart.savingConfig : chart.saveConfig}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 p-3">
              {chartReady ? (
                <div
                  ref={chartRef}
                  className="rounded-xl border border-border/60 bg-card p-3"
                >
                  <ChartRenderer
                    result={result}
                    config={chartConfig}
                    className="h-[min(48vh,380px)] min-h-[220px] w-full"
                  />
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-muted-foreground text-sm leading-relaxed">
                  {chart.emptyChart}
                </p>
              )}
            </div>

            <CollapsibleContent className="border-t border-border/60">
              <ChartConfigForm
                columns={result.columns}
                config={chartConfig}
                onChange={setChartConfig}
                showToolbar={false}
                showTypeSelector={false}
                className="border-b-0"
              />
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { ChartPanel };