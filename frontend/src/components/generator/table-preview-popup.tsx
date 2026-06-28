"use client";

import { TableIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableDetail, useTablePreview } from "@/hooks/use-schema";
import { generator } from "@/lib/microcopy";
import { cn } from "@/lib/utils";

const SAMPLE_ROW_LIMIT = 5;

type TablePreviewPopupProps = {
  datasourceId: string | null;
  tableName: string;
  className?: string;
};

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function TablePreviewPopup({
  datasourceId,
  tableName,
  className,
}: TablePreviewPopupProps) {
  const detailQuery = useTableDetail(datasourceId, tableName);
  const previewQuery = useTablePreview(datasourceId, tableName);

  const columns = detailQuery.data?.columns ?? [];
  const relations = detailQuery.data?.relations ?? [];
  const previewColumns = previewQuery.data?.columns ?? [];
  const previewRows = (previewQuery.data?.rows ?? []).slice(0, SAMPLE_ROW_LIMIT);
  const isLoading = detailQuery.isLoading || previewQuery.isLoading;
  const hasError = detailQuery.isError || previewQuery.isError;

  return (
    <aside
      className={cn(
        "flex max-h-72 w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-popover shadow-md",
        className,
      )}
      aria-label={`Preview tabel ${tableName}`}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <HugeiconsIcon icon={TableIcon} strokeWidth={2} className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-mono font-medium text-xs">{tableName}</p>
          {!isLoading && !hasError ? (
            <p className="text-[0.65rem] text-muted-foreground">
              {columns.length} kolom
              {relations.length ? ` · ${relations.length} relasi` : ""}
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : hasError ? (
          <p className="text-destructive text-xs">
            {detailQuery.error?.message ?? previewQuery.error?.message}
          </p>
        ) : (
          <>
            <section className="space-y-1.5">
              <p className="font-medium text-[0.625rem] text-muted-foreground uppercase tracking-wide">
                {generator.tablePreviewColumns}
              </p>
              <ul className="max-h-24 space-y-1 overflow-y-auto">
                {columns.map((column) => (
                  <li
                    key={column.name}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/25 px-2 py-1"
                  >
                    <span className="truncate font-mono text-[0.7rem]">
                      {column.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="font-mono text-[0.65rem] text-muted-foreground">
                        {column.type}
                      </span>
                      {column.primary_key ? (
                        <Badge
                          variant="default"
                          className="h-4 px-1 text-[0.6rem]"
                        >
                          PK
                        </Badge>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {relations.length > 0 ? (
              <section className="space-y-1.5">
                <p className="font-medium text-[0.625rem] text-muted-foreground uppercase tracking-wide">
                  {generator.tablePreviewRelations}
                </p>
                <ul className="max-h-20 space-y-1 overflow-y-auto">
                  {relations.map((relation) => (
                    <li
                      key={`${relation.column}-${relation.referenced_table}`}
                      className="rounded-md bg-muted/20 px-2 py-1 font-mono text-[0.65rem] leading-relaxed"
                    >
                      {relation.column} → {relation.referenced_table}.
                      {relation.referenced_column}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-[0.625rem] text-muted-foreground uppercase tracking-wide">
                  {generator.tablePreviewSample}
                </p>
                {previewRows.length > 0 ? (
                  <span className="font-mono text-[0.65rem] text-muted-foreground tabular-nums">
                    {previewRows.length} {generator.tablePreviewRows}
                  </span>
                ) : null}
              </div>

              {previewColumns.length > 0 ? (
                <div className="overflow-x-auto rounded-md border border-border/60">
                  <table className="w-full min-w-max text-[0.65rem]">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        {previewColumns.map((column) => (
                          <th
                            key={column.name}
                            className="px-2 py-1.5 text-left font-medium font-mono whitespace-nowrap"
                          >
                            {column.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.length > 0 ? (
                        previewRows.map((row, rowIndex) => (
                          <tr
                            key={`preview-row-${rowIndex}`}
                            className="border-b border-border/40 last:border-0"
                          >
                            {row.map((cell, cellIndex) => (
                              <td
                                key={`preview-row-${rowIndex}-col-${cellIndex}`}
                                className="max-w-[120px] truncate px-2 py-1.5 font-mono"
                                title={formatCellValue(cell)}
                              >
                                {formatCellValue(cell)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={previewColumns.length}
                            className="px-2 py-3 text-center text-muted-foreground"
                          >
                            {generator.tablePreviewEmpty}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {generator.tablePreviewEmpty}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </aside>
  );
}

export { TablePreviewPopup };