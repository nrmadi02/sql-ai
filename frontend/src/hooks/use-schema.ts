"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { toasts } from "@/lib/microcopy";
import type { ListTablesResult, QueryResult, TableDetail } from "@/lib/types";

const SCHEMA_STALE_TIME_MS = 5 * 60 * 1000;

export const schemaKeys = {
  tables: (datasourceId: string) => ["schema", datasourceId, "tables"] as const,
  tableDetail: (datasourceId: string, tableName: string) =>
    ["schema", datasourceId, "tables", tableName] as const,
  tablePreview: (datasourceId: string, tableName: string) =>
    ["schema", datasourceId, "tables", tableName, "preview"] as const,
  completions: (datasourceId: string) =>
    ["schema", datasourceId, "completions"] as const,
};

export function useSchemaTables(datasourceId: string | null) {
  return useQuery({
    queryKey: schemaKeys.tables(datasourceId ?? ""),
    queryFn: () =>
      api.get<ListTablesResult>(`/api/v1/datasources/${datasourceId}/tables`),
    enabled: Boolean(datasourceId),
    staleTime: SCHEMA_STALE_TIME_MS,
  });
}

export function useTableDetail(
  datasourceId: string | null,
  tableName: string | null,
) {
  return useQuery({
    queryKey: schemaKeys.tableDetail(datasourceId ?? "", tableName ?? ""),
    queryFn: () =>
      api.get<TableDetail>(
        `/api/v1/datasources/${datasourceId}/tables/${encodeURIComponent(tableName ?? "")}`,
      ),
    enabled: Boolean(datasourceId && tableName),
    staleTime: SCHEMA_STALE_TIME_MS,
  });
}

export function useTablePreview(
  datasourceId: string | null,
  tableName: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: schemaKeys.tablePreview(datasourceId ?? "", tableName ?? ""),
    queryFn: () =>
      api.get<QueryResult>(
        `/api/v1/datasources/${datasourceId}/tables/${encodeURIComponent(tableName ?? "")}/preview`,
      ),
    enabled: Boolean(datasourceId && tableName && enabled),
    staleTime: SCHEMA_STALE_TIME_MS,
  });
}

type SyncSchemaResult = {
  datasource_id: string;
  table_count: number;
  schema_cached_at: string;
};

export function useSyncSchema(datasourceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<SyncSchemaResult>(`/api/v1/datasources/${datasourceId}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: schemaKeys.tables(datasourceId),
      });
      toast.success(toasts.schemaSynced);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
