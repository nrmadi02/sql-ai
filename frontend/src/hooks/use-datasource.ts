"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, testConnection } from "@/lib/api";
import { errors, toasts } from "@/lib/microcopy";
import type { DatasourceFormValues } from "@/lib/schemas/datasource";
import type {
  CreateDatasourceInput,
  Datasource,
  TestConnectionResult,
  UpdateDatasourceInput,
} from "@/lib/types";

export const datasourceKeys = {
  all: ["datasources"] as const,
  detail: (id: string) => ["datasources", id] as const,
};

export function useDatasources() {
  return useQuery({
    queryKey: datasourceKeys.all,
    queryFn: () => api.get<Datasource[]>("/api/v1/datasources"),
  });
}

export function useCreateDatasource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDatasourceInput) =>
      api.post<Datasource>("/api/v1/datasources", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.all });
      toast.success("Datasource berhasil ditambahkan");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateDatasource(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDatasourceInput) =>
      api.put<Datasource>(`/api/v1/datasources/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.all });
      queryClient.invalidateQueries({ queryKey: datasourceKeys.detail(id) });
      toast.success("Perubahan datasource tersimpan");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteDatasource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/datasources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.all });
      toast.success(toasts.datasourceDeleted);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useTestDatasourceConnection() {
  return useMutation({
    mutationFn: ({
      values,
      datasourceId,
    }: {
      values: DatasourceFormValues;
      datasourceId?: string;
    }) => testConnection(values, datasourceId),
    onSuccess: (result: TestConnectionResult) => {
      if (result.success) {
        toast.success(toasts.connectionSucceeded);
      } else {
        toast.error(result.message || errors.dbConnectionFailed);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || errors.dbConnectionFailed);
    },
  });
}
