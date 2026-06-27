"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryHistoryKeys } from "@/hooks/use-query-history";
import { api } from "@/lib/api";
import { sqlEditor } from "@/lib/microcopy";
import type {
  CreateSqlEditorSessionInput,
  CreateSqlEditorTabInput,
  QueryExecutionResponse,
  SqlEditorAutocomplete,
  SqlEditorSession,
  SqlEditorTab,
  RunSqlEditorTabInput,
  UpdateSqlEditorSessionInput,
  UpdateSqlEditorTabInput,
} from "@/lib/types";

export const sqlEditorKeys = {
  all: ["sql-editor-sessions"] as const,
  detail: (id: string) => ["sql-editor-sessions", id] as const,
  autocomplete: (datasourceId: string) =>
    ["sql-editor-autocomplete", datasourceId] as const,
};

export function useSqlEditorSessions() {
  return useQuery({
    queryKey: sqlEditorKeys.all,
    queryFn: () => api.get<SqlEditorSession[]>("/api/v1/sql-editor/sessions"),
  });
}

export function useSqlEditorSession(sessionId: string | null) {
  return useQuery({
    queryKey: sqlEditorKeys.detail(sessionId ?? ""),
    queryFn: () =>
      api.get<SqlEditorSession>(`/api/v1/sql-editor/sessions/${sessionId}`),
    enabled: Boolean(sessionId),
  });
}

export function useSqlEditorAutocomplete(datasourceId: string | null) {
  return useQuery({
    queryKey: sqlEditorKeys.autocomplete(datasourceId ?? ""),
    queryFn: () =>
      api.get<SqlEditorAutocomplete>(
        `/api/v1/sql-editor/autocomplete/${datasourceId}`,
      ),
    enabled: Boolean(datasourceId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSqlEditorSession() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateSqlEditorSessionInput) =>
      api.post<SqlEditorSession>("/api/v1/sql-editor/sessions", input),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: sqlEditorKeys.all });
      router.push(`/sql-editor/${session.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteSqlEditorSession() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (sessionId: string) =>
      api.delete(`/api/v1/sql-editor/sessions/${sessionId}`),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: sqlEditorKeys.all });
      queryClient.removeQueries({
        queryKey: sqlEditorKeys.detail(sessionId),
      });
      router.push("/sql-editor");
      toast.success(sqlEditor.sessionDeleted);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSqlEditorSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSqlEditorSessionInput) =>
      api.put<SqlEditorSession>(
        `/api/v1/sql-editor/sessions/${sessionId}`,
        input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sqlEditorKeys.detail(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: sqlEditorKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRenameSqlEditorSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      name,
      datasource_id,
    }: {
      sessionId: string;
      name: string;
      datasource_id?: string;
    }) =>
      api.put<SqlEditorSession>(`/api/v1/sql-editor/sessions/${sessionId}`, {
        name,
        datasource_id,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: sqlEditorKeys.detail(variables.sessionId),
      });
      queryClient.invalidateQueries({ queryKey: sqlEditorKeys.all });
      toast.success(sqlEditor.sessionRenamed);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateSqlEditorTab(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSqlEditorTabInput = {}) =>
      api.post<SqlEditorTab>(
        `/api/v1/sql-editor/sessions/${sessionId}/tabs`,
        input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sqlEditorKeys.detail(sessionId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSqlEditorTab(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tabId,
      input,
    }: {
      tabId: string;
      input: UpdateSqlEditorTabInput;
    }) =>
      api.put(`/api/v1/sql-editor/sessions/${sessionId}/tabs/${tabId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sqlEditorKeys.detail(sessionId),
      });
    },
  });
}

export function useDeleteSqlEditorTab(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tabId: string) =>
      api.delete(`/api/v1/sql-editor/sessions/${sessionId}/tabs/${tabId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sqlEditorKeys.detail(sessionId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRunSqlEditorTab(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tabId,
      ...input
    }: { tabId: string } & RunSqlEditorTabInput) =>
      api.post<QueryExecutionResponse>(
        `/api/v1/sql-editor/sessions/${sessionId}/tabs/${tabId}/run`,
        input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sqlEditorKeys.detail(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: queryHistoryKeys.all });
    },
  });
}

export function useOpenInSqlEditor() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      sql,
      datasourceId,
      name,
    }: {
      sql: string;
      datasourceId?: string;
      name?: string;
    }) => {
      const session = await api.post<SqlEditorSession>(
        "/api/v1/sql-editor/sessions",
        {
          name: name ?? sqlEditor.untitledSession,
          datasource_id: datasourceId,
        },
      );

      const defaultTab = session.tabs?.[0];
      if (defaultTab && sql.trim()) {
        await api.put(
          `/api/v1/sql-editor/sessions/${session.id}/tabs/${defaultTab.id}`,
          {
            name: defaultTab.name,
            sql_content: sql,
          },
        );
      }

      return session;
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: sqlEditorKeys.all });
      router.push(`/sql-editor/${session.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
