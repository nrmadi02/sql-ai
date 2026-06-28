"use client";

import {
  Analytics01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  TableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ChartConfigForm } from "@/components/chart/chart-config";
import { ChartRenderer } from "@/components/chart/chart-renderer";
import { ChartSuggestions } from "@/components/chart/chart-suggestions";
import { EmptyState } from "@/components/empty-state";
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
  useChartSuggest,
  useCreateChartConfig,
  useUpdateChartConfig,
} from "@/hooks/use-chart";
import { exportChartElementToPng } from "@/lib/chart-export";
import {
  analyzeChartDataset,
  buildChartRecommendationMessage,
  type ChartAxisConfig,
  exportChartDataToCsv,
  getChartExportColumns,
  isChartConfigValid,
  mergeChartHints,
  normalizeChartAxisConfig,
  suggestChartDefaults,
  transformQueryResultForChart,
} from "@/lib/chart-utils";
import { chart } from "@/lib/microcopy";
import type {
  ChartConfigRecord,
  ChartHints,
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
  chartHints?: ChartHints;
  onRecommendationClick?: (message: string) => void | Promise<void>;
  isRecommendationPending?: boolean;
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
  chartHints,
  onRecommendationClick,
  isRecommendationPending = false,
}: ChartPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("table");
  const [configOpen, setConfigOpen] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartAxisConfig>(() =>
    normalizeChartAxisConfig(
      suggestChartDefaults(
        result.columns,
        result.rows,
        chartHints?.suggested_chart,
      ),
      result.columns,
      result.rows,
    ),
  );

  const localAnalysis = useMemo(
    () =>
      analyzeChartDataset(
        result.columns,
        result.rows,
        result.row_count ?? result.rows.length,
      ),
    [result.columns, result.row_count, result.rows],
  );

  const suggestQuery = useChartSuggest(
    {
      columns: result.columns,
      rows: result.rows,
      row_count: result.row_count ?? result.rows.length,
    },
    activeTab === "chart",
  );

  const datasetAnalysis = useMemo(() => {
    const remote = suggestQuery.data;
    const base = remote ?? localAnalysis;
    return mergeChartHints(base, chartHints);
  }, [chartHints, localAnalysis, suggestQuery.data]);

  const isChartable = datasetAnalysis.chartable;
  const isLargeDataset = datasetAnalysis.large_dataset;
  const aggregationSuggestions = datasetAnalysis.suggested_aggregations;
  const filterSuggestions = datasetAnalysis.suggested_filters;

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
      setChartConfig(
        normalizeChartAxisConfig(
          recordToAxisConfig(saved),
          result.columns,
          result.rows,
        ),
      );
      return;
    }

    setConfigId(null);
    setChartConfig(
      normalizeChartAxisConfig(
        suggestChartDefaults(
          result.columns,
          result.rows,
          chartHints?.suggested_chart,
        ),
        result.columns,
        result.rows,
      ),
    );
  }, [
    chartConfigsQuery.data,
    chartConfigsQuery.isLoading,
    chartHints?.suggested_chart,
    result.columns,
    result.rows,
  ]);

  useEffect(() => {
    if (suggestQuery.isError) {
      toast.error(chart.suggestFailed);
    }
  }, [suggestQuery.isError]);

  const handleRecommendationSelect = useCallback(
    async (suggestion: string) => {
      if (isRecommendationPending) {
        toast.message(chart.recommendationSending);
        return;
      }

      if (!onRecommendationClick) {
        toast.message(chart.recommendationUnavailable);
        return;
      }

      await onRecommendationClick(buildChartRecommendationMessage(suggestion));
    },
    [isRecommendationPending, onRecommendationClick],
  );

  const handleSave = useCallback(async () => {
    if (!isChartConfigValid(chartConfig) || !canPersist || !isChartable) return;

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
    isChartable,
    referenceFilter,
    updateChart,
  ]);

  const chartReady = isChartable && isChartConfigValid(chartConfig);

  const handleExportPng = useCallback(async () => {
    if (!chartRef.current || !chartReady) {
      toast.error(chart.invalidConfig);
      return;
    }

    if (activeTab !== "chart") {
      setActiveTab("chart");
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const target = chartRef.current;
    if (!target) {
      toast.error(chart.exportFailed);
      return;
    }

    try {
      await exportChartElementToPng(
        target,
        `grafik-${chartConfig.chartType}.png`,
      );
      toast.success(chart.exportPngSuccess);
    } catch {
      toast.error(chart.exportFailed);
    }
  }, [
    activeTab,
    chartConfig.chartType,
    chartReady,
    isChartable,
  ]);

  const handleExportCsv = useCallback(() => {
    if (!isChartConfigValid(chartConfig) || !isChartable) {
      toast.error(chart.invalidConfig);
      return;
    }

    const data = transformQueryResultForChart(result, chartConfig);
    const columns = getChartExportColumns(chartConfig);
    exportChartDataToCsv(data, columns);
    toast.success(chart.exportCsvSuccess);
  }, [chartConfig, isChartable, result]);

  const recommendationDisabled = isRecommendationPending;
  const recommendationActionable = Boolean(onRecommendationClick);

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
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          {tableView}
        </TabsContent>

        <TabsContent
          value="chart"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain data-[state=inactive]:hidden"
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
                  disabled={!isChartable}
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
                      disabled={!isChartable}
                    >
                      {item.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={!isChartable}
                  >
                    <HugeiconsIcon
                      icon={configOpen ? ArrowUp01Icon : ArrowDown01Icon}
                      strokeWidth={2}
                    />
                    {configOpen ? chart.configureHide : chart.configureToggle}
                  </Button>
                </CollapsibleTrigger>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => void handleExportPng()}
                  disabled={!chartReady}
                >
                  {chart.exportPng}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleExportCsv}
                  disabled={!chartReady}
                >
                  {chart.exportCsv}
                </Button>
                {canPersist ? (
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => void handleSave()}
                    disabled={isSaving || !chartReady}
                  >
                    {isSaving ? chart.savingConfig : chart.saveConfig}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 space-y-3 p-3">
              {!isChartable ? (
                <EmptyState
                  icon={Analytics01Icon}
                  title={chart.nonChartableTitle}
                  description={chart.nonChartableDescription}
                  className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-10"
                >
                  <ChartSuggestions
                    title={chart.aggregationHintTitle}
                    suggestions={aggregationSuggestions}
                    onSelect={(suggestion) =>
                      void handleRecommendationSelect(suggestion)
                    }
                    disabled={recommendationDisabled}
                    actionable={recommendationActionable}
                    isLoading={
                      suggestQuery.isLoading && !aggregationSuggestions.length
                    }
                    variant="aggregation"
                    className="w-full max-w-xl border-dashed"
                  />
                </EmptyState>
              ) : (
                <>
                  {isLargeDataset ? (
                    <div className="space-y-2">
                      <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-amber-800 text-xs leading-relaxed dark:text-amber-200">
                        {chart.largeDatasetNotice}
                      </p>
                      <ChartSuggestions
                        title={chart.filterHintTitle}
                        suggestions={filterSuggestions}
                        onSelect={(suggestion) =>
                          void handleRecommendationSelect(suggestion)
                        }
                        disabled={recommendationDisabled}
                        actionable={recommendationActionable}
                        isLoading={
                          suggestQuery.isLoading && !filterSuggestions.length
                        }
                        variant="filter"
                      />
                    </div>
                  ) : null}

                  {chartReady ? (
                    <div
                      ref={chartRef}
                      className="rounded-xl border border-border/60 bg-card p-3 transition-opacity duration-200"
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
                </>
              )}
            </div>

            <CollapsibleContent className="border-t border-border/60">
              <ChartConfigForm
                columns={result.columns}
                rows={result.rows}
                config={chartConfig}
                onChange={setChartConfig}
                showToolbar={false}
                showTypeSelector={false}
                disabled={!isChartable}
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
