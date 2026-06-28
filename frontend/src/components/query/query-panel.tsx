"use client";

import { Edit02Icon, PlayIcon, TableIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { QueryWorkspaceDialog } from "@/components/query/query-workspace-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryWorkspace } from "@/hooks/use-query-workspace";
import { query } from "@/lib/microcopy";
import { previewSql } from "@/lib/query-utils";
import type { ChartHints, DatasourceType, GeneratorMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

type QueryPanelProps = {
  message: GeneratorMessage;
  datasourceId: string | null;
  dbType?: DatasourceType;
  sessionId: string;
  className?: string;
  onRecommendationClick?: (message: string) => void | Promise<void>;
  isRecommendationPending?: boolean;
};

function QueryPanel({
  message,
  datasourceId,
  dbType,
  sessionId,
  className,
  onRecommendationClick,
  isRecommendationPending,
}: QueryPanelProps) {
  const workspace = useQueryWorkspace({ message, datasourceId, sessionId });
  const sqlPreview = previewSql(workspace.sql);
  const lineCount = workspace.sql.trim().split("\n").length;
  const hasResult = Boolean(workspace.result);
  const hasError = Boolean(workspace.error);
  const chartHints = useMemo<ChartHints | undefined>(() => {
    const metadata = message.ai_metadata;
    if (!metadata) return undefined;

    return {
      suggested_aggregations: metadata.suggested_aggregations,
      suggested_filters: metadata.suggested_filters,
      suggested_chart: metadata.suggested_chart as ChartHints["suggested_chart"],
    };
  }, [message.ai_metadata]);

  const handleRecommendationClick = async (content: string) => {
    if (!onRecommendationClick) return;
    await onRecommendationClick(content);
    workspace.setDialogOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "w-full overflow-hidden rounded-xl border border-border/60 bg-card",
          className,
        )}
      >
        <button
          type="button"
          onClick={workspace.openWorkspace}
          className="w-full cursor-pointer border-0 bg-muted/15 px-3 py-2.5 text-left transition-colors hover:bg-muted/25"
        >
          <pre className="overflow-hidden font-mono text-[0.7rem] text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {sqlPreview}
          </pre>
          {lineCount > 3 ? (
            <p className="mt-1.5 text-muted-foreground text-[0.65rem]">
              +{lineCount - 3} {query.previewMore}
            </p>
          ) : null}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {hasResult && workspace.result ? (
              <>
                <Badge variant="secondary" className="font-mono">
                  {workspace.result.row_count.toLocaleString("id-ID")} baris
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {workspace.result.execution_time_ms} ms
                </Badge>
                {workspace.result.truncated ? (
                  <Badge
                    variant="outline"
                    className="text-amber-700 dark:text-amber-300"
                  >
                    Terpotong
                  </Badge>
                ) : null}
              </>
            ) : null}
            {hasError ? (
              <Badge variant="destructive">{query.queryFailed}</Badge>
            ) : null}
            {workspace.isRunning ? (
              <Badge variant="outline">{query.running}</Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {hasResult ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={workspace.openResults}
              >
                <HugeiconsIcon icon={TableIcon} strokeWidth={2} />
                {query.viewResults}
              </Button>
            ) : null}
            <Button type="button" size="xs" onClick={workspace.openWorkspace}>
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
              {query.openWorkspace}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={async () => {
                workspace.openWorkspace();
                await workspace.handleRun();
              }}
              disabled={!workspace.canRun || workspace.isRunning}
            >
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />
              {query.runLabel}
            </Button>
          </div>
        </div>

        {hasError ? (
          <p className="border-t border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive text-xs leading-relaxed">
            {workspace.error}
          </p>
        ) : null}
      </div>

      <QueryWorkspaceDialog
        open={workspace.dialogOpen}
        onOpenChange={workspace.setDialogOpen}
        sql={workspace.sql}
        onSqlChange={workspace.setSql}
        dbType={dbType}
        datasourceId={datasourceId}
        generatorMessageId={message.id}
        onRun={workspace.handleRun}
        isRunning={workspace.isRunning}
        canRun={workspace.canRun}
        error={workspace.error}
        result={workspace.result}
        chartHints={chartHints}
        onRecommendationClick={
          onRecommendationClick ? handleRecommendationClick : undefined
        }
        isRecommendationPending={isRecommendationPending}
      />
    </>
  );
}

export { QueryPanel };
