"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { toasts } from "@/lib/microcopy";
import type {
  ChartConfigRecord,
  ChartReferenceFilter,
  CreateChartConfigInput,
  UpdateChartConfigInput,
} from "@/lib/types";

export const chartKeys = {
  all: ["charts"] as const,
  list: (filter: ChartReferenceFilter) => ["charts", filter] as const,
  detail: (id: string) => ["charts", id] as const,
};

function buildChartListPath(filter: ChartReferenceFilter): string {
  const params = new URLSearchParams();

  if (filter.saved_query_id) {
    params.set("saved_query_id", filter.saved_query_id);
  }
  if (filter.generator_message_id) {
    params.set("generator_message_id", filter.generator_message_id);
  }
  if (filter.sql_editor_tab_id) {
    params.set("sql_editor_tab_id", filter.sql_editor_tab_id);
  }

  const queryString = params.toString();
  return `/api/v1/charts${queryString ? `?${queryString}` : ""}`;
}

function hasChartReference(filter: ChartReferenceFilter): boolean {
  return Boolean(
    filter.saved_query_id ||
      filter.generator_message_id ||
      filter.sql_editor_tab_id,
  );
}

export function useChartConfigs(filter: ChartReferenceFilter, enabled = true) {
  return useQuery({
    queryKey: chartKeys.list(filter),
    queryFn: () => api.get<ChartConfigRecord[]>(buildChartListPath(filter)),
    enabled: enabled && hasChartReference(filter),
  });
}

export function useChartConfig(id: string, enabled = true) {
  return useQuery({
    queryKey: chartKeys.detail(id),
    queryFn: () => api.get<ChartConfigRecord>(`/api/v1/charts/${id}`),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateChartConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChartConfigInput) =>
      api.post<ChartConfigRecord>("/api/v1/charts", {
        ...input,
        config: input.config ?? {},
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: chartKeys.all });
      if (
        created.saved_query_id ||
        created.generator_message_id ||
        created.sql_editor_tab_id
      ) {
        queryClient.invalidateQueries({
          queryKey: chartKeys.list({
            saved_query_id: created.saved_query_id,
            generator_message_id: created.generator_message_id,
            sql_editor_tab_id: created.sql_editor_tab_id,
          }),
        });
      }
      toast.success(toasts.chartSaved);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateChartConfig(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateChartConfigInput) =>
      api.put<ChartConfigRecord>(`/api/v1/charts/${id}`, {
        ...input,
        config: input.config ?? {},
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: chartKeys.all });
      queryClient.invalidateQueries({ queryKey: chartKeys.detail(id) });
      if (
        updated.saved_query_id ||
        updated.generator_message_id ||
        updated.sql_editor_tab_id
      ) {
        queryClient.invalidateQueries({
          queryKey: chartKeys.list({
            saved_query_id: updated.saved_query_id,
            generator_message_id: updated.generator_message_id,
            sql_editor_tab_id: updated.sql_editor_tab_id,
          }),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteChartConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/charts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chartKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
