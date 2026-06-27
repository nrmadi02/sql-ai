"use client";

import { sqlEditor } from "@/lib/microcopy";
import { cn } from "@/lib/utils";

type SqlEditorStatusBarProps = {
  datasourceName?: string;
  dialect?: string;
  executionTimeMs?: number;
  rowCount?: number;
  truncated?: boolean;
  className?: string;
};

function SqlEditorStatusBar({
  datasourceName,
  dialect,
  executionTimeMs,
  rowCount,
  truncated = false,
  className,
}: SqlEditorStatusBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 bg-muted/20 px-3 py-1.5 font-mono text-[0.65rem] text-muted-foreground",
        className,
      )}
    >
      <span>
        {sqlEditor.statusBarDatasource}:{" "}
        <span className="text-foreground">{datasourceName ?? "—"}</span>
      </span>
      <span>
        {sqlEditor.statusBarDialect}:{" "}
        <span className="text-foreground uppercase">{dialect ?? "—"}</span>
      </span>
      {executionTimeMs !== undefined ? (
        <span>
          {sqlEditor.statusBarDuration}:{" "}
          <span className="text-foreground">{executionTimeMs} ms</span>
        </span>
      ) : null}
      {rowCount !== undefined ? (
        <span>
          {sqlEditor.statusBarRows}:{" "}
          <span className="text-foreground">
            {rowCount.toLocaleString("id-ID")}
          </span>
        </span>
      ) : null}
      {truncated ? (
        <span className="text-amber-600 dark:text-amber-400">
          Hasil dipotong
        </span>
      ) : null}
    </div>
  );
}

export { SqlEditorStatusBar };
