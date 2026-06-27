"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, testAiProviderConnection } from "@/lib/api";
import { errors, toasts } from "@/lib/microcopy";
import type { AiProviderFormValues } from "@/lib/schemas/ai-provider";
import type {
  AiProvider,
  CreateAiProviderInput,
  TestConnectionResult,
  UpdateAiProviderInput,
} from "@/lib/types";

export const aiProviderKeys = {
  all: ["ai-providers"] as const,
  detail: (id: string) => ["ai-providers", id] as const,
};

export function useAiProviders() {
  return useQuery({
    queryKey: aiProviderKeys.all,
    queryFn: () => api.get<AiProvider[]>("/api/v1/ai-providers"),
  });
}

export function useCreateAiProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAiProviderInput) =>
      api.post<AiProvider>("/api/v1/ai-providers", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.all });
      toast.success("AI provider berhasil ditambahkan");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAiProvider(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAiProviderInput) =>
      api.put<AiProvider>(`/api/v1/ai-providers/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.all });
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.detail(id) });
      toast.success("Perubahan provider tersimpan");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSetDefaultAiProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: AiProvider) =>
      api.put<AiProvider>(`/api/v1/ai-providers/${provider.id}`, {
        name: provider.name,
        api_format: provider.api_format,
        base_url: provider.base_url,
        api_key: "",
        model: provider.model,
        is_default: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.all });
      toast.success(toasts.providerDefaultSet);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteAiProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/ai-providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.all });
      toast.success(toasts.providerDeleted);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useTestAiProviderConnection() {
  return useMutation({
    mutationFn: ({
      values,
      providerId,
    }: {
      values: AiProviderFormValues;
      providerId?: string;
    }) => testAiProviderConnection(values, providerId),
    onSuccess: (result: TestConnectionResult) => {
      if (result.success) {
        toast.success(toasts.connectionSucceeded);
      } else {
        toast.error(result.message || errors.aiConnectionFailed);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || errors.aiConnectionFailed);
    },
  });
}
