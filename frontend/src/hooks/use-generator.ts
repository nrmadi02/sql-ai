"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { api, streamGeneratorMessage } from "@/lib/api";
import { errors } from "@/lib/microcopy";
import type {
  AIMetadata,
  CreateSessionInput,
  GeneratorMessage,
  GeneratorSession,
  SendMessageInput,
  SessionDetail,
} from "@/lib/types";

export const generatorKeys = {
  all: ["generator-sessions"] as const,
  detail: (id: string) => ["generator-sessions", id] as const,
};

export function useGeneratorSessions() {
  return useQuery({
    queryKey: generatorKeys.all,
    queryFn: () => api.get<GeneratorSession[]>("/api/v1/generator/sessions"),
  });
}

export function useGeneratorSession(sessionId: string | null) {
  return useQuery({
    queryKey: generatorKeys.detail(sessionId ?? ""),
    queryFn: () =>
      api.get<SessionDetail>(`/api/v1/generator/sessions/${sessionId}`),
    enabled: Boolean(sessionId),
  });
}

export function useCreateGeneratorSession() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateSessionInput) =>
      api.post<GeneratorSession>("/api/v1/generator/sessions", input),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: generatorKeys.all });
      router.push(`/generator/${session.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteGeneratorSession() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.delete(`/api/v1/generator/sessions/${sessionId}`),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: generatorKeys.all });
      queryClient.removeQueries({
        queryKey: generatorKeys.detail(sessionId),
      });
      router.push("/generator");
      toast.success("Sesi dihapus");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

type StreamingState = {
  content: string;
  metadata: AIMetadata | null;
  isStreaming: boolean;
};

export function useSendGeneratorMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const [streaming, setStreaming] = useState<StreamingState>({
    content: "",
    metadata: null,
    isStreaming: false,
  });

  const sendMessage = useCallback(
    async (input: SendMessageInput) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStreaming({ content: "", metadata: null, isStreaming: true });

      try {
        await streamGeneratorMessage(
          sessionId,
          input,
          {
            onUserMessage: (message: GeneratorMessage) => {
              queryClient.setQueryData<SessionDetail>(
                generatorKeys.detail(sessionId),
                (current) => {
                  if (!current) return current;
                  return {
                    ...current,
                    messages: [...current.messages, message],
                  };
                },
              );
            },
            onMeta: (metadata: AIMetadata) => {
              setStreaming((prev) => ({
                ...prev,
                metadata,
                isStreaming: true,
              }));
            },
            onDelta: (delta: string) => {
              setStreaming((prev) => ({
                ...prev,
                content: prev.content + delta,
                isStreaming: true,
              }));
            },
            onDone: (message: GeneratorMessage) => {
              queryClient.setQueryData<SessionDetail>(
                generatorKeys.detail(sessionId),
                (current) => {
                  if (!current) return current;
                  return {
                    ...current,
                    messages: [...current.messages, message],
                  };
                },
              );
              queryClient.invalidateQueries({ queryKey: generatorKeys.all });
              setStreaming({ content: "", metadata: null, isStreaming: false });
            },
            onError: (message: string) => {
              const normalized = message.toLowerCase();
              if (normalized.includes("schema not cached")) {
                toast.error(
                  "Schema belum tersedia. Sinkronkan dulu di sidebar.",
                );
              } else if (normalized.includes("table not found")) {
                toast.error("Tabel tidak ditemukan di schema datasource.");
              } else if (normalized.includes("ai")) {
                toast.error(errors.aiConnectionFailed);
              } else {
                toast.error(message);
              }
              setStreaming({ content: "", metadata: null, isStreaming: false });
            },
          },
          controller.signal,
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setStreaming({ content: "", metadata: null, isStreaming: false });
          return;
        }
        const message =
          error instanceof Error ? error.message : "Gagal mengirim pesan";
        toast.error(message);
        setStreaming({ content: "", metadata: null, isStreaming: false });
      }
    },
    [queryClient, sessionId],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setStreaming({ content: "", metadata: null, isStreaming: false });
  }, []);

  return {
    sendMessage,
    cancelStream,
    streamingContent: streaming.content,
    streamingMetadata: streaming.metadata,
    isStreaming: streaming.isStreaming,
  };
}
