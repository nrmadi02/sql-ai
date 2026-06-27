"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generatorKeys } from "@/hooks/use-generator";
import { queryHistoryKeys } from "@/hooks/use-query-history";
import { api } from "@/lib/api";
import type { ExecuteQueryInput, QueryExecutionResponse } from "@/lib/types";

export function useExecuteQuery(sessionId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExecuteQueryInput) =>
      api.post<QueryExecutionResponse>("/api/v1/query/execute", input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryHistoryKeys.all });
      if (sessionId && variables.message_id) {
        queryClient.invalidateQueries({
          queryKey: generatorKeys.detail(sessionId),
        });
      }
    },
  });
}
