"use client";

import { Clock01Icon } from "@hugeicons/core-free-icons";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StandaloneQueryWorkspace } from "@/components/query/standalone-query-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDatasources } from "@/hooks/use-datasource";
import { useQueryHistory } from "@/hooks/use-query-history";
import { history } from "@/lib/microcopy";
import { previewSql } from "@/lib/query-utils";
import type { QueryHistoryEntry } from "@/lib/types";

const historyParsers = {
  page: parseAsInteger.withDefault(1),
  status: parseAsString.withDefault(""),
  datasource: parseAsString.withDefault(""),
};

function HistoryRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-12 w-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-10" />
      </TableCell>
    </TableRow>
  );
}

function statusLabel(status: QueryHistoryEntry["status"]) {
  return status === "success" ? history.statusSuccess : history.statusFailed;
}

function QueryHistorySettings() {
  const [filters, setFilters] = useQueryStates(historyParsers);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<QueryHistoryEntry | null>(
    null,
  );

  const { data: datasources } = useDatasources();
  const { data, isLoading } = useQueryHistory({
    page: filters.page,
    pageSize: 20,
    status: filters.status || undefined,
    datasourceId: filters.datasource || undefined,
  });

  const openEntry = (entry: QueryHistoryEntry) => {
    setSelectedEntry(entry);
    setWorkspaceOpen(true);
  };

  const hasItems = Boolean(data?.items.length);
  const showFilteredEmpty =
    !isLoading && !hasItems && (filters.status || filters.datasource);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {history.pageTitle}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {history.pageDescription}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.datasource || "all"}
          onValueChange={(value) => {
            void setFilters({
              datasource: value === "all" ? "" : value,
              page: 1,
            });
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={history.allDatasources} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{history.allDatasources}</SelectItem>
            {datasources?.map((ds) => (
              <SelectItem key={ds.id} value={ds.id}>
                {ds.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(value) => {
            void setFilters({
              status: value === "all" ? "" : value,
              page: 1,
            });
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={history.allStatuses} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{history.allStatuses}</SelectItem>
            <SelectItem value="success">{history.statusSuccess}</SelectItem>
            <SelectItem value="failed">{history.statusFailed}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/60 bg-card/80">
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{history.columnTime}</TableHead>
                <TableHead>{history.columnSql}</TableHead>
                <TableHead>{history.columnStatus}</TableHead>
                <TableHead>{history.columnDuration}</TableHead>
                <TableHead>{history.columnRows}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => (
                <HistoryRowSkeleton key={`history-skeleton-${id}`} />
              ))}
            </TableBody>
          </Table>
        ) : !hasItems ? (
          <div className="flex h-full min-h-[280px] items-center justify-center">
            <EmptyState
              icon={Clock01Icon}
              title={
                showFilteredEmpty ? history.noResults : "Belum ada riwayat"
              }
              description={
                showFilteredEmpty
                  ? "Coba ubah filter datasource atau status."
                  : "Setiap query yang kamu jalankan akan tercatat di sini, lengkap dengan status dan waktu eksekusi."
              }
            />
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-[140px]">
                      {history.columnTime}
                    </TableHead>
                    <TableHead>{history.columnSql}</TableHead>
                    <TableHead className="w-[100px]">
                      {history.columnStatus}
                    </TableHead>
                    <TableHead className="w-[90px]">
                      {history.columnDuration}
                    </TableHead>
                    <TableHead className="w-[80px]">
                      {history.columnRows}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer transition-colors hover:bg-muted/30"
                      onClick={() => openEntry(entry)}
                    >
                      <TableCell className="align-top font-mono text-[0.7rem] text-muted-foreground">
                        {format(
                          new Date(entry.created_at),
                          "d MMM yyyy, HH:mm",
                          {
                            locale: localeId,
                          },
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <pre className="line-clamp-2 font-mono text-[0.65rem] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {previewSql(entry.sql_content, 2)}
                        </pre>
                        {entry.error_message ? (
                          <p className="mt-1 line-clamp-1 text-destructive text-[0.65rem]">
                            {entry.error_message}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant={
                            entry.status === "success"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {statusLabel(entry.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top font-mono text-[0.7rem]">
                        {entry.execution_time_ms != null
                          ? `${entry.execution_time_ms} ms`
                          : "—"}
                      </TableCell>
                      <TableCell className="align-top font-mono text-[0.7rem]">
                        {entry.row_count != null
                          ? entry.row_count.toLocaleString("id-ID")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data && data.total_pages > 1 ? (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
                <p className="text-muted-foreground text-xs">
                  Halaman {data.page} dari {data.total_pages} ·{" "}
                  {data.total.toLocaleString("id-ID")} entri
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={data.page <= 1}
                    onClick={() => void setFilters({ page: data.page - 1 })}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={data.page >= data.total_pages}
                    onClick={() => void setFilters({ page: data.page + 1 })}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {selectedEntry ? (
        <StandaloneQueryWorkspace
          key={selectedEntry.id}
          initialSql={selectedEntry.sql_content}
          initialDatasourceId={selectedEntry.datasource_id}
          open={workspaceOpen}
          onOpenChange={setWorkspaceOpen}
        />
      ) : null}
    </div>
  );
}

export { QueryHistorySettings };
