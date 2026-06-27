"use client";

import { useEffect, useState } from "react";
import { useExecuteQuery } from "@/hooks/use-query";
import { normalizeQueryError, parseStoredResult } from "@/lib/query-utils";
import type { GeneratorMessage, QueryExecutionResponse } from "@/lib/types";

type UseQueryWorkspaceOptions = {
  message: GeneratorMessage;
  datasourceId: string | null;
  sessionId: string;
};

export function useQueryWorkspace({
  message,
  datasourceId,
  sessionId,
}: UseQueryWorkspaceOptions) {
  const initialSql = message.edited_sql || message.generated_sql || "";
  const [sql, setSql] = useState(initialSql);
  const [result, setResult] = useState<QueryExecutionResponse | null>(() =>
    parseStoredResult(message.query_result),
  );
  const [error, setError] = useState<string | null>(
    message.error_message ?? null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const executeMutation = useExecuteQuery(sessionId);

  useEffect(() => {
    setSql(message.edited_sql || message.generated_sql || "");
    setResult(parseStoredResult(message.query_result));
    setError(message.error_message ?? null);
  }, [
    message.edited_sql,
    message.generated_sql,
    message.query_result,
    message.error_message,
  ]);

  const handleRun = async () => {
    if (!datasourceId || !sql.trim()) return;

    setError(null);

    try {
      const response = await executeMutation.mutateAsync({
        sql,
        datasource_id: datasourceId,
        message_id: message.id,
      });
      setResult(response);
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : "Query gagal dijalankan";
      setError(normalizeQueryError(messageText));
      setResult(null);
    }
  };

  const openWorkspace = () => setDialogOpen(true);
  const openResults = () => setDialogOpen(true);

  return {
    sql,
    setSql,
    result,
    error,
    dialogOpen,
    setDialogOpen,
    isRunning: executeMutation.isPending,
    canRun: Boolean(datasourceId && sql.trim()),
    handleRun,
    openWorkspace,
    openResults,
  };
}
