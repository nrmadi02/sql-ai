"use client";

import { TableIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useTableDetail, useTablePreview } from "@/hooks/use-schema";
import { cn } from "@/lib/utils";

type TablePreviewSheetProps = {
  datasourceId: string | null;
  tableName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ScrollableTableFrameProps = {
  children: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
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

function ScrollableTableFrame({
  children,
  className,
  stickyHeader = false,
}: ScrollableTableFrameProps) {
  return (
    <div
      className={cn(
        "overflow-auto rounded-lg border border-border/60 bg-card",
        className,
      )}
    >
      <table
        className={cn(
          "w-full min-w-max caption-bottom text-xs",
          stickyHeader &&
            "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-card [&_thead_th]:shadow-[inset_0_-1px_0_var(--border)]",
        )}
      >
        {children}
      </table>
    </div>
  );
}

function TablePreviewSheet({
  datasourceId,
  tableName,
  open,
  onOpenChange,
}: TablePreviewSheetProps) {
  const detailQuery = useTableDetail(datasourceId, open ? tableName : null);
  const previewQuery = useTablePreview(
    datasourceId,
    open ? tableName : null,
    open,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-6 py-5">
          <div className="flex items-center gap-2 pr-8">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon
                icon={TableIcon}
                strokeWidth={2}
                className="size-4"
              />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate font-heading">
                {tableName ?? "Tabel"}
              </SheetTitle>
              <SheetDescription>
                Kolom, relasi, dan 50 baris pertama
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-6 py-5">
          <section className="flex shrink-0 flex-col gap-3">
            <h3 className="font-heading text-sm font-semibold">Kolom</h3>
            {detailQuery.isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : detailQuery.isError ? (
              <p className="text-destructive text-sm">
                {detailQuery.error.message}
              </p>
            ) : (
              <ScrollableTableFrame className="max-h-44">
                <thead>
                  <tr className="border-b">
                    <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                      Nama
                    </th>
                    <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                      Tipe
                    </th>
                    <th className="h-10 px-2 text-right align-middle font-medium whitespace-nowrap">
                      Atribut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(detailQuery.data?.columns ?? []).map((column) => (
                    <tr
                      key={column.name}
                      className="border-b transition-colors last:border-0"
                    >
                      <td className="p-2 align-middle font-mono text-xs">
                        {column.name}
                      </td>
                      <td className="p-2 align-middle font-mono text-muted-foreground text-xs">
                        {column.type}
                      </td>
                      <td className="p-2 text-right align-middle">
                        <div className="flex flex-wrap justify-end gap-1">
                          {column.primary_key ? (
                            <Badge variant="default" className="text-[0.65rem]">
                              PK
                            </Badge>
                          ) : null}
                          {column.foreign_key ? (
                            <Badge
                              variant="secondary"
                              className="font-mono text-[0.65rem]"
                            >
                              FK
                            </Badge>
                          ) : null}
                          {!column.nullable ? (
                            <Badge variant="outline" className="text-[0.65rem]">
                              NOT NULL
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ScrollableTableFrame>
            )}

            {detailQuery.data?.relations?.length ? (
              <div className="max-h-28 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="mb-2 text-muted-foreground text-xs font-medium">
                  Relasi
                </p>
                <ul className="flex flex-col gap-1.5">
                  {detailQuery.data?.relations?.map((relation) => (
                    <li
                      key={`${relation.column}-${relation.referenced_table}`}
                      className="font-mono text-xs"
                    >
                      {relation.column} → {relation.referenced_table}.
                      {relation.referenced_column}
                      <span className="text-muted-foreground">
                        {" "}
                        ({relation.type})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <h3 className="font-heading text-sm font-semibold">
                Preview data
              </h3>
              {previewQuery.data ? (
                <span className="font-mono text-muted-foreground text-xs">
                  {previewQuery.data.row_count} baris
                </span>
              ) : null}
            </div>

            {previewQuery.isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : previewQuery.isError ? (
              <p className="text-destructive text-sm">
                {previewQuery.error.message}
              </p>
            ) : (previewQuery.data?.columns?.length ?? 0) > 0 ? (
              <ScrollableTableFrame stickyHeader className="min-h-0 flex-1">
                <thead>
                  <tr className="border-b">
                    {(previewQuery.data?.columns ?? []).map((column) => (
                      <th
                        key={column.name}
                        className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap font-mono text-xs"
                      >
                        {column.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(previewQuery.data?.rows?.length ?? 0) > 0 ? (
                    (previewQuery.data?.rows ?? []).map((row, rowIndex) => (
                      <tr
                        key={`row-${rowIndex}`}
                        className="border-b transition-colors last:border-0"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`row-${rowIndex}-col-${cellIndex}`}
                            className="max-w-[240px] truncate p-2 align-middle font-mono text-xs"
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
                        colSpan={(previewQuery.data?.columns ?? []).length}
                        className="p-4 text-center text-muted-foreground text-sm"
                      >
                        Tabel kosong
                      </td>
                    </tr>
                  )}
                </tbody>
              </ScrollableTableFrame>
            ) : (
              <p className="text-muted-foreground text-sm">
                Tidak ada data untuk ditampilkan.
              </p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { TablePreviewSheet };
