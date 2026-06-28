"use client";

import { Database02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { QueryActions } from "@/components/query/query-actions";
import { QueryEditor } from "@/components/query/query-editor";
import { QueryResult } from "@/components/query/query-result";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { query } from "@/lib/microcopy";
import type { DatasourceType, QueryExecutionResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

type QueryWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sql: string;
  onSqlChange: (value: string) => void;
  dbType?: DatasourceType;
  datasourceId: string | null;
  generatorMessageId?: string;
  onRun: () => void;
  isRunning: boolean;
  canRun: boolean;
  error: string | null;
  result: QueryExecutionResponse | null;
};

function QueryResultSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={`result-row-${index}`} className="h-8 w-full" />
      ))}
    </div>
  );
}

function QueryWorkspaceDialog({
  open,
  onOpenChange,
  sql,
  onSqlChange,
  dbType,
  datasourceId,
  generatorMessageId,
  onRun,
  isRunning,
  canRun,
  error,
  result,
}: QueryWorkspaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(94vh,900px)] min-h-0 max-w-[min(96vw,1120px)]! flex-col gap-0 overflow-hidden p-0",
          "top-[50%] left-[50%] h-[min(94vh,900px)] translate-x-[-50%] translate-y-[-50%]",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon
                icon={Database02Icon}
                strokeWidth={2}
                className="size-4"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="font-heading text-base">
                {query.workspaceTitle}
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                {query.workspaceDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="shrink-0 border-b border-border/60">
            <QueryEditor
              value={sql}
              dbType={dbType}
              datasourceId={datasourceId}
              onChange={onSqlChange}
              minHeight="140px"
              className="rounded-none border-0"
            />
          </div>

          {error ? (
            <p className="shrink-0 border-b border-destructive/20 bg-destructive/5 px-4 py-2.5 text-destructive text-xs leading-relaxed">
              {error}
            </p>
          ) : null}

          <QueryActions
            onRun={onRun}
            isRunning={isRunning}
            disabled={!canRun}
            sql={sql}
            datasourceId={datasourceId}
            generatorMessageId={generatorMessageId}
            executionTimeMs={result?.execution_time_ms}
            rowCount={result?.row_count}
            truncated={result?.truncated}
          />

          <div className="flex min-h-[min(48vh,420px)] flex-1 flex-col bg-muted/10">
            {isRunning ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3 text-muted-foreground text-xs">
                  <Spinner className="size-3.5" />
                  {query.running}
                </div>
                <QueryResultSkeleton />
              </div>
            ) : result ? (
              <QueryResult
                result={result}
                className="min-h-0 flex-1"
                generatorMessageId={generatorMessageId}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 py-10">
                <p className="max-w-sm text-center text-muted-foreground text-sm leading-relaxed">
                  {query.waitingResult}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { QueryWorkspaceDialog };
