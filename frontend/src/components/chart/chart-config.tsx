"use client";

import {
  Download01Icon,
  FloppyDiskIcon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CHART_PALETTE_COLORS,
  type ChartAxisConfig,
  isNumericColumnType,
} from "@/lib/chart-utils";
import { chart } from "@/lib/microcopy";
import type { ChartColorPalette, ChartType, QueryColumn } from "@/lib/types";
import { cn } from "@/lib/utils";

type ChartConfigFormProps = {
  columns: QueryColumn[];
  config: ChartAxisConfig;
  onChange: (config: ChartAxisConfig) => void;
  onSave?: () => void;
  onExportPng?: () => void;
  onExportCsv?: () => void;
  isSaving?: boolean;
  canPersist?: boolean;
  showToolbar?: boolean;
  showTypeSelector?: boolean;
  className?: string;
};

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: chart.typeBar },
  { value: "line", label: chart.typeLine },
  { value: "pie", label: chart.typePie },
  { value: "area", label: chart.typeArea },
];

const PALETTE_OPTIONS: { value: ChartColorPalette; label: string }[] = [
  { value: "default", label: chart.paletteDefault },
  { value: "warm", label: chart.paletteWarm },
  { value: "cool", label: chart.paletteCool },
  { value: "mono", label: chart.paletteMono },
];

function ChartConfigForm({
  columns,
  config,
  onChange,
  onSave,
  onExportPng,
  onExportCsv,
  isSaving = false,
  canPersist = false,
  showToolbar = true,
  showTypeSelector = true,
  className,
}: ChartConfigFormProps) {
  const columnNames = useMemo(
    () => columns.map((column) => column.name),
    [columns],
  );

  const numericColumns = useMemo(
    () =>
      columns
        .filter((column) => isNumericColumnType(column.type))
        .map((column) => column.name),
    [columns],
  );

  const yAxisOptions = numericColumns.length > 0 ? numericColumns : columnNames;

  const updateConfig = (patch: Partial<ChartAxisConfig>) => {
    onChange({ ...config, ...patch });
  };

  const updateVisualConfig = (
    patch: NonNullable<ChartAxisConfig["visualConfig"]>,
  ) => {
    onChange({
      ...config,
      visualConfig: {
        ...config.visualConfig,
        ...patch,
      },
    });
  };

  const palette = config.visualConfig?.color_palette ?? "default";
  const paletteColors = CHART_PALETTE_COLORS[palette];

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/60 bg-muted/10 px-3 py-3",
        className,
      )}
    >
      {showToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-muted-foreground text-[0.65rem] uppercase tracking-wide">
            {chart.configTitle}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {onExportPng ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onExportPng}
              >
                <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />
                {chart.exportPng}
              </Button>
            ) : null}
            {onExportCsv ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onExportCsv}
              >
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                {chart.exportCsv}
              </Button>
            ) : null}
            {canPersist && onSave ? (
              <Button
                type="button"
                size="xs"
                onClick={onSave}
                disabled={isSaving}
              >
                <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
                {isSaving ? chart.savingConfig : chart.saveConfig}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-3",
          showTypeSelector
            ? "md:grid-cols-2 xl:grid-cols-4"
            : "md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {showTypeSelector ? (
          <div className="space-y-1.5">
            <Label className="text-xs">{chart.typeLabel}</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={config.chartType}
              onValueChange={(value) => {
                if (value) updateConfig({ chartType: value as ChartType });
              }}
              className="flex w-full flex-wrap justify-start"
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
        ) : null}

        <div className="space-y-1.5">
          <Label className="text-xs">{chart.xAxisLabel}</Label>
          <Select
            value={config.xAxisColumn}
            onValueChange={(value) => updateConfig({ xAxisColumn: value })}
          >
            <SelectTrigger className="h-8 font-mono text-xs">
              <SelectValue placeholder={chart.xAxisLabel} />
            </SelectTrigger>
            <SelectContent>
              {columnNames.map((name) => (
                <SelectItem
                  key={name}
                  value={name}
                  className="font-mono text-xs"
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{chart.yAxisLabel}</Label>
          <Select
            value={config.yAxisColumns[0] ?? ""}
            onValueChange={(value) => updateConfig({ yAxisColumns: [value] })}
          >
            <SelectTrigger className="h-8 font-mono text-xs">
              <SelectValue placeholder={chart.yAxisLabel} />
            </SelectTrigger>
            <SelectContent>
              {yAxisOptions.map((name) => (
                <SelectItem
                  key={name}
                  value={name}
                  className="font-mono text-xs"
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{chart.categoryLabel}</Label>
          <Select
            value={config.categoryColumn || "__none__"}
            onValueChange={(value) =>
              updateConfig({
                categoryColumn: value === "__none__" ? "" : value,
              })
            }
          >
            <SelectTrigger className="h-8 font-mono text-xs">
              <SelectValue placeholder={chart.categoryLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs">
                {chart.categoryNone}
              </SelectItem>
              {columnNames
                .filter((name) => name !== config.xAxisColumn)
                .map((name) => (
                  <SelectItem
                    key={name}
                    value={name}
                    className="font-mono text-xs"
                  >
                    {name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[10rem] space-y-1.5">
          <Label className="text-xs">{chart.colorLabel}</Label>
          <Select
            value={palette}
            onValueChange={(value) =>
              updateVisualConfig({
                color_palette: value as ChartColorPalette,
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={chart.colorLabel} />
            </SelectTrigger>
            <SelectContent>
              {PALETTE_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5 pb-0.5">
          {paletteColors.map((color) => (
            <span
              key={`${palette}-${color}`}
              className="size-4 rounded-full border border-border/60"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export { ChartConfigForm };
