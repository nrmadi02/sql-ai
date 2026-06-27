"use client";

import {
  Copy01Icon,
  FloppyDiskIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { SaveQueryDialog } from "@/components/query/save-query-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { buttons, query, toasts } from "@/lib/microcopy";
import { cn } from "@/lib/utils";

type QueryActionsProps = {
  onRun: () => void;
  isRunning?: boolean;
  disabled?: boolean;
  sql?: string;
  datasourceId?: string | null;
  generatorMessageId?: string;
  executionTimeMs?: number;
  rowCount?: number;
  truncated?: boolean;
  className?: string;
};

async function copySqlToClipboard(sql: string) {
  await navigator.clipboard.writeText(sql);
  toast.success(toasts.sqlCopied);
}

function QueryActions({
  onRun,
  isRunning = false,
  disabled = false,
  sql = "",
  datasourceId,
  generatorMessageId,
  executionTimeMs,
  rowCount,
  truncated = false,
  className,
}: QueryActionsProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const hasStats = executionTimeMs !== undefined || rowCount !== undefined;
  const canSave = Boolean(sql.trim());

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/15 px-3 py-2",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={onRun}
            disabled={disabled || isRunning}
            aria-label={query.runLabel}
          >
            {isRunning ? (
              <Spinner className="size-3.5" />
            ) : (
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />
            )}
            {buttons.run}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canSave}
            onClick={() => setSaveOpen(true)}
          >
            <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
            {buttons.save}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canSave}
            onClick={() => copySqlToClipboard(sql)}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            {buttons.copy}
          </Button>
        </div>

        {hasStats ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-muted-foreground text-[0.65rem]">
            {executionTimeMs !== undefined ? (
              <span>
                {query.executionTime}:{" "}
                <span className="text-foreground">{executionTimeMs} ms</span>
              </span>
            ) : null}
            {rowCount !== undefined ? (
              <span>
                {query.rowCount}:{" "}
                <span className="text-foreground">
                  {rowCount.toLocaleString("id-ID")}
                </span>
              </span>
            ) : null}
            {truncated ? (
              <span className="text-amber-600 dark:text-amber-400">
                {query.truncated}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <SaveQueryDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        sql={sql}
        datasourceId={datasourceId ?? undefined}
        generatorMessageId={generatorMessageId}
      />
    </>
  );
}

export { QueryActions };
