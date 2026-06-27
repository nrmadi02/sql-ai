"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDatasources } from "@/hooks/use-datasource";
import { useExecuteQuery } from "@/hooks/use-query";
import { normalizeQueryError } from "@/lib/query-utils";
import type { DatasourceType, QueryExecutionResponse } from "@/lib/types";

type UseStandaloneQueryOptions = {
  initialSql?: string;
  initialDatasourceId?: string;
  autoRun?: boolean;
};

export function useStandaloneQuery({
  initialSql = "",
  initialDatasourceId,
  autoRun = false,
}: UseStandaloneQueryOptions = {}) {
  const { data: datasources } = useDatasources();
  const [sql, setSql] = useState(initialSql);
  const [datasourceId, setDatasourceId] = useState<string | null>(
    initialDatasourceId ?? null,
  );
  const [result, setResult] = useState<QueryExecutionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const executeMutation = useExecuteQuery();

  const activeDatasource = datasources?.find(
    (item) => item.id === datasourceId,
  );
  const dbType = activeDatasource?.db_type as DatasourceType | undefined;

  useEffect(() => {
    setSql(initialSql);
    setDatasourceId(initialDatasourceId ?? null);
    setResult(null);
    setError(null);
  }, [initialSql, initialDatasourceId]);

  const handleRun = useCallback(async () => {
    if (!datasourceId || !sql.trim()) return;

    setError(null);

    try {
      const response = await executeMutation.mutateAsync({
        sql,
        datasource_id: datasourceId,
      });
      setResult(response);
    } catch (err) {
      const messageText =
        err instanceof Error ? err.message : "Query gagal dijalankan";
      setError(normalizeQueryError(messageText));
      setResult(null);
    }
  }, [datasourceId, executeMutation, sql]);

  const autoRunRef = useRef(false);

  useEffect(() => {
    if (
      !autoRun ||
      !dialogOpen ||
      !datasourceId ||
      !sql.trim() ||
      autoRunRef.current
    ) {
      return;
    }
    autoRunRef.current = true;
    void handleRun();
  }, [autoRun, dialogOpen, datasourceId, handleRun, sql]);

  useEffect(() => {
    if (!dialogOpen) {
      autoRunRef.current = false;
    }
  }, [dialogOpen]);

  return {
    sql,
    setSql,
    datasourceId,
    setDatasourceId,
    dbType,
    result,
    error,
    dialogOpen,
    setDialogOpen,
    isRunning: executeMutation.isPending,
    canRun: Boolean(datasourceId && sql.trim()),
    handleRun,
  };
}
