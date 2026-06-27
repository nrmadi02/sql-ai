"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { toasts } from "@/lib/microcopy";
import type {
  CreateSavedQueryInput,
  SavedQuery,
  UpdateSavedQueryInput,
} from "@/lib/types";

export const savedQueryKeys = {
  all: ["saved-queries"] as const,
  list: (search?: string, tag?: string) =>
    ["saved-queries", { search, tag }] as const,
  detail: (id: string) => ["saved-queries", id] as const,
};

export function useSavedQueries(search?: string, tag?: string) {
  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  if (tag?.trim()) params.set("tag", tag.trim());
  const queryString = params.toString();

  return useQuery({
    queryKey: savedQueryKeys.list(search, tag),
    queryFn: () =>
      api.get<SavedQuery[]>(
        `/api/v1/saved-queries${queryString ? `?${queryString}` : ""}`,
      ),
  });
}

export function useSavedQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: savedQueryKeys.detail(id),
    queryFn: () => api.get<SavedQuery>(`/api/v1/saved-queries/${id}`),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateSavedQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSavedQueryInput) =>
      api.post<SavedQuery>("/api/v1/saved-queries", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedQueryKeys.all });
      toast.success(toasts.querySaved);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSavedQuery(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSavedQueryInput) =>
      api.put<SavedQuery>(`/api/v1/saved-queries/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: savedQueryKeys.detail(id) });
      toast.success(toasts.querySaved);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteSavedQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/saved-queries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedQueryKeys.all });
      toast.success("Query tersimpan dihapus");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
