"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { ChartPanel } from "@/components/chart/chart-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { query } from "@/lib/microcopy";
import { formatCellValue, rowsToRecords } from "@/lib/query-utils";
import type {
  ChartHints,
  QueryColumn,
  QueryExecutionResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type QueryResultProps = {
  result: QueryExecutionResponse;
  className?: string;
  generatorMessageId?: string;
  sqlEditorTabId?: string;
  savedQueryId?: string;
  chartHints?: ChartHints;
  onRecommendationClick?: (message: string) => void | Promise<void>;
  isRecommendationPending?: boolean;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function QueryResultTable({
  result,
  className,
}: Pick<QueryResultProps, "result" | "className">) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  const data = useMemo(
    () => rowsToRecords(result.columns, result.rows),
    [result.columns, result.rows],
  );

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      result.columns.map((column: QueryColumn) => ({
        accessorKey: column.name,
        header: column.name,
        meta: { type: column.type },
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span
              className="block max-w-[280px] truncate font-mono"
              title={formatCellValue(value)}
            >
              {formatCellValue(value)}
            </span>
          );
        },
        filterFn: "includesString",
      })),
    [result.columns],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const pageStart =
    filteredRowCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const pageEnd = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    filteredRowCount,
  );

  if (result.columns.length === 0) {
    return (
      <p className="px-3 py-4 text-muted-foreground text-sm">
        {query.emptyResult}
      </p>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <p className="font-medium text-muted-foreground text-[0.65rem] uppercase tracking-wide">
          {query.resultTitle}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="xs">
              <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
              {query.columnVisibility}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{query.columnVisibility}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table.getAllLeafColumns().map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                <span className="truncate font-mono">{column.id}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <Table
          className="table-fixed"
          style={{ width: table.getCenterTotalSize() }}
        >
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative bg-card font-mono text-xs"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex flex-col gap-1.5 py-1">
                        <button
                          type="button"
                          className={cn(
                            "flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground",
                            header.column.getCanSort() &&
                              "cursor-pointer select-none",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getIsSorted() === "asc" ? (
                            <HugeiconsIcon
                              icon={ArrowUp01Icon}
                              strokeWidth={2}
                              className="size-3 shrink-0"
                            />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <HugeiconsIcon
                              icon={ArrowDown01Icon}
                              strokeWidth={2}
                              className="size-3 shrink-0"
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={ArrowUpDownIcon}
                              strokeWidth={2}
                              className="size-3 shrink-0 opacity-40"
                            />
                          )}
                        </button>
                        {header.column.getCanFilter() ? (
                          <Input
                            value={
                              (header.column.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                              header.column.setFilterValue(event.target.value)
                            }
                            placeholder={query.filterPlaceholder}
                            className="h-6 font-mono text-[0.65rem]"
                          />
                        ) : null}
                      </div>
                    )}
                    {header.column.getCanResize() ? (
                      <button
                        type="button"
                        aria-label={`Resize ${header.column.id}`}
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none bg-border/60 opacity-0 transition-opacity hover:opacity-100",
                          header.column.getIsResizing() && "opacity-100",
                        )}
                      />
                    ) : null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="font-mono text-xs"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-16 text-center text-muted-foreground"
                >
                  {query.emptyResult}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-3 py-2">
        <p className="text-muted-foreground text-xs">
          {query.showingRows}{" "}
          <span className="font-mono text-foreground">
            {pageStart}-{pageEnd}
          </span>{" "}
          {query.ofTotal}{" "}
          <span className="font-mono text-foreground">
            {filteredRowCount.toLocaleString("id-ID")}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) =>
              table.setPageSize(Number.parseInt(value, 10))
            }
          >
            <SelectTrigger className="h-7 w-[5.5rem] font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Prev
            </Button>
            <span className="min-w-16 text-center font-mono text-xs">
              {pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueryResult({
  result,
  className,
  generatorMessageId,
  sqlEditorTabId,
  savedQueryId,
  chartHints,
  onRecommendationClick,
  isRecommendationPending,
}: QueryResultProps) {
  return (
    <ChartPanel
      result={result}
      className={className}
      generatorMessageId={generatorMessageId}
      sqlEditorTabId={sqlEditorTabId}
      savedQueryId={savedQueryId}
      chartHints={chartHints}
      onRecommendationClick={onRecommendationClick}
      isRecommendationPending={isRecommendationPending}
      tableView={
        <QueryResultTable result={result} className="min-h-0 flex-1" />
      }
    />
  );
}

export { QueryResult, QueryResultTable };
