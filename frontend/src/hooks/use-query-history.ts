"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { QueryHistoryEntry, QueryHistoryPage } from "@/lib/types";

export type QueryHistoryFilters = {
  datasourceId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
};

export const queryHistoryKeys = {
  all: ["query-history"] as const,
  list: (filters: QueryHistoryFilters) => ["query-history", filters] as const,
  detail: (id: string) => ["query-history", id] as const,
};

function buildHistoryQuery(filters: QueryHistoryFilters): string {
  const params = new URLSearchParams();
  if (filters.datasourceId) params.set("datasource_id", filters.datasourceId);
  if (filters.status) params.set("status", filters.status);
  if (filters.fromDate) params.set("from_date", filters.fromDate);
  if (filters.toDate) params.set("to_date", filters.toDate);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("page_size", String(filters.pageSize));
  const queryString = params.toString();
  return `/api/v1/query-history${queryString ? `?${queryString}` : ""}`;
}

export function useQueryHistory(filters: QueryHistoryFilters) {
  return useQuery({
    queryKey: queryHistoryKeys.list(filters),
    queryFn: () => api.get<QueryHistoryPage>(buildHistoryQuery(filters)),
  });
}

export function useQueryHistoryEntry(id: string, enabled = true) {
  return useQuery({
    queryKey: queryHistoryKeys.detail(id),
    queryFn: () => api.get<QueryHistoryEntry>(`/api/v1/query-history/${id}`),
    enabled: enabled && Boolean(id),
  });
}
