"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDatasources } from "@/hooks/use-datasource";
import {
  useCreateSqlEditorTab,
  useDeleteSqlEditorTab,
  useRunSqlEditorTab,
  useSqlEditorAutocomplete,
  useSqlEditorSession,
  useUpdateSqlEditorSession,
  useUpdateSqlEditorTab,
} from "@/hooks/use-sql-editor";
import { sqlEditor, toasts } from "@/lib/microcopy";
import { normalizeQueryError, parseStoredResult } from "@/lib/query-utils";
import { formatSql, parseSqlErrorLine } from "@/lib/sql-format";
import type {
  DatasourceType,
  QueryExecutionResponse,
  SqlEditorTab,
} from "@/lib/types";

export type SqlEditorPaneHandle = {
  getSelection: () => string | null;
  insertText: (text: string) => void;
  formatDocument: () => string;
  focus: () => void;
};

type LocalTabState = {
  name: string;
  sql_content: string;
};

type UseSqlEditorWorkspaceOptions = {
  sessionId: string;
  initialSql?: string;
};

const AUTOSAVE_MS = 1000;

export function useSqlEditorWorkspace({
  sessionId,
  initialSql,
}: UseSqlEditorWorkspaceOptions) {
  const sessionQuery = useSqlEditorSession(sessionId);
  const updateSession = useUpdateSqlEditorSession(sessionId);
  const updateTab = useUpdateSqlEditorTab(sessionId);
  const createTab = useCreateSqlEditorTab(sessionId);
  const deleteTab = useDeleteSqlEditorTab(sessionId);
  const runTab = useRunSqlEditorTab(sessionId);
  const { data: datasources } = useDatasources();

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [localTabs, setLocalTabs] = useState<Record<string, LocalTabState>>({});
  const [result, setResult] = useState<QueryExecutionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const paneRef = useRef<SqlEditorPaneHandle | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const initialSqlApplied = useRef(false);

  const session = sessionQuery.data;
  const datasourceId = session?.datasource_id ?? null;
  const autocompleteQuery = useSqlEditorAutocomplete(datasourceId);

  const activeDatasource = datasources?.find(
    (item) => item.id === datasourceId,
  );
  const dbType = (activeDatasource?.db_type ?? "postgresql") as DatasourceType;
  const dialect = autocompleteQuery.data?.dialect ?? dbType;

  const sortedTabs = useMemo(() => {
    const tabs = session?.tabs ?? [];
    return [...tabs].sort((a, b) => a.sort_order - b.sort_order);
  }, [session?.tabs]);

  const activeTab = sortedTabs.find((tab) => tab.id === activeTabId) ?? null;

  const getTabState = useCallback(
    (tab: SqlEditorTab): LocalTabState => {
      const local = localTabs[tab.id];
      if (local) return local;
      return { name: tab.name, sql_content: tab.sql_content };
    },
    [localTabs],
  );

  const activeSql = activeTab ? getTabState(activeTab).sql_content : "";
  const activeName = activeTab ? getTabState(activeTab).name : "";

  useEffect(() => {
    if (!sortedTabs.length) return;

    setActiveTabId((current) => {
      if (current && sortedTabs.some((tab) => tab.id === current)) {
        return current;
      }
      return sortedTabs[0]?.id ?? null;
    });
  }, [sortedTabs]);

  useEffect(() => {
    if (!session?.tabs || initialSqlApplied.current || !initialSql?.trim()) {
      return;
    }

    const firstTab = [...session.tabs].sort(
      (a, b) => a.sort_order - b.sort_order,
    )[0];
    if (!firstTab) return;

    initialSqlApplied.current = true;
    setLocalTabs((current) => ({
      ...current,
      [firstTab.id]: {
        name: firstTab.name,
        sql_content: initialSql,
      },
    }));
    setActiveTabId(firstTab.id);
    void updateTab.mutateAsync({
      tabId: firstTab.id,
      input: { name: firstTab.name, sql_content: initialSql },
    });
  }, [initialSql, session?.tabs, updateTab]);

  useEffect(() => {
    if (!activeTab) {
      setResult(null);
      setError(null);
      setErrorLine(null);
      return;
    }

    if (activeTab.last_status === "failed" && activeTab.error_message) {
      setError(activeTab.error_message);
      setErrorLine(parseSqlErrorLine(activeTab.error_message));
      setResult(null);
      return;
    }

    if (activeTab.last_status === "success" && activeTab.last_result) {
      setResult(parseStoredResult(activeTab.last_result));
      setError(null);
      setErrorLine(null);
      return;
    }

    setResult(null);
    setError(null);
    setErrorLine(null);
  }, [activeTab]);

  const flushTabSave = useCallback(
    async (tabId: string) => {
      const tab = sortedTabs.find((item) => item.id === tabId);
      const local = localTabs[tabId];
      if (!tab || !local) return;

      if (local.name === tab.name && local.sql_content === tab.sql_content) {
        return;
      }

      await updateTab.mutateAsync({
        tabId,
        input: {
          name: local.name,
          sql_content: local.sql_content,
          sort_order: tab.sort_order,
        },
      });
    },
    [localTabs, sortedTabs, updateTab],
  );

  const scheduleTabSave = useCallback(
    (tabId: string) => {
      const existing = saveTimers.current[tabId];
      if (existing) clearTimeout(existing);

      saveTimers.current[tabId] = setTimeout(() => {
        void flushTabSave(tabId);
      }, AUTOSAVE_MS);
    },
    [flushTabSave],
  );

  useEffect(() => {
    return () => {
      for (const timer of Object.values(saveTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

  const setSql = useCallback(
    (value: string) => {
      if (!activeTabId || !activeTab) return;
      setLocalTabs((current) => ({
        ...current,
        [activeTabId]: {
          name: current[activeTabId]?.name ?? activeTab.name,
          sql_content: value,
        },
      }));
      scheduleTabSave(activeTabId);
    },
    [activeTab, activeTabId, scheduleTabSave],
  );

  const setTabName = useCallback(
    (name: string) => {
      if (!activeTabId || !activeTab) return;
      setLocalTabs((current) => ({
        ...current,
        [activeTabId]: {
          name,
          sql_content:
            current[activeTabId]?.sql_content ?? activeTab.sql_content,
        },
      }));
      scheduleTabSave(activeTabId);
    },
    [activeTab, activeTabId, scheduleTabSave],
  );

  const setDatasourceId = useCallback(
    (nextDatasourceId: string | null) => {
      if (!session) return;
      updateSession.mutate({
        name: session.name,
        datasource_id: nextDatasourceId ?? undefined,
      });
    },
    [session, updateSession],
  );

  const handleRenameSession = useCallback(
    (name: string) => {
      if (!session) return;
      updateSession.mutate(
        {
          name,
          datasource_id: session.datasource_id,
        },
        {
          onSuccess: () => {
            toast.success(sqlEditor.sessionRenamed);
          },
        },
      );
    },
    [session, updateSession],
  );

  const handleRun = useCallback(async () => {
    if (!activeTabId || !activeTab || !datasourceId) return;

    const selection = paneRef.current?.getSelection()?.trim();
    const fullSql = activeSql.trim();
    const sqlToRun = selection || fullSql;
    if (!sqlToRun) return;

    setError(null);
    setErrorLine(null);

    try {
      await flushTabSave(activeTabId);
      const runSelection = Boolean(selection && selection !== fullSql);
      const response = await runTab.mutateAsync({
        tabId: activeTabId,
        sql: runSelection ? selection : undefined,
      });

      setResult(response);
      toast.success(toasts.querySucceeded);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Query gagal dijalankan";
      const normalized = normalizeQueryError(message);
      setError(normalized);
      setErrorLine(parseSqlErrorLine(message));
      setResult(null);
    }
  }, [
    activeSql,
    activeTab,
    activeTabId,
    datasourceId,
    flushTabSave,
    runTab,
  ]);

  const handleFormat = useCallback(() => {
    const formatted = paneRef.current?.formatDocument();
    if (formatted !== undefined) {
      setSql(formatted);
    } else {
      setSql(formatSql(activeSql));
    }
  }, [activeSql, setSql]);

  const handleCopy = useCallback(async () => {
    if (!activeSql.trim()) return;
    await navigator.clipboard.writeText(activeSql);
    toast.success(toasts.sqlCopied);
  }, [activeSql]);

  const handleInsertText = useCallback((text: string) => {
    paneRef.current?.insertText(text);
    paneRef.current?.focus();
  }, []);

  const handleCreateTab = useCallback(async () => {
    const tab = await createTab.mutateAsync({});
    setActiveTabId(tab.id);
    setLocalTabs((current) => ({
      ...current,
      [tab.id]: { name: tab.name, sql_content: tab.sql_content },
    }));
  }, [createTab]);

  const handleCloseTab = useCallback(
    async (tabId: string) => {
      if (sortedTabs.length <= 1) return;

      const timer = saveTimers.current[tabId];
      if (timer) clearTimeout(timer);

      const index = sortedTabs.findIndex((tab) => tab.id === tabId);
      const nextTab = sortedTabs[index + 1] ?? sortedTabs[index - 1];

      await deleteTab.mutateAsync(tabId);
      setLocalTabs((current) => {
        const next = { ...current };
        delete next[tabId];
        return next;
      });

      if (activeTabId === tabId && nextTab) {
        setActiveTabId(nextTab.id);
      }
    },
    [activeTabId, deleteTab, sortedTabs],
  );

  const handleRenameTab = useCallback(
    (tabId: string, name: string) => {
      const tab = sortedTabs.find((item) => item.id === tabId);
      if (!tab) return;

      setLocalTabs((current) => ({
        ...current,
        [tabId]: {
          name,
          sql_content: current[tabId]?.sql_content ?? tab.sql_content,
        },
      }));
      scheduleTabSave(tabId);
    },
    [scheduleTabSave, sortedTabs],
  );

  const handleReorderTabs = useCallback(
    async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((tabId, index) => {
          const tab = sortedTabs.find((item) => item.id === tabId);
          const local = localTabs[tabId];
          if (!tab) return Promise.resolve();

          return updateTab.mutateAsync({
            tabId,
            input: {
              name: local?.name ?? tab.name,
              sql_content: local?.sql_content ?? tab.sql_content,
              sort_order: index,
            },
          });
        }),
      );
    },
    [localTabs, sortedTabs, updateTab],
  );

  const handleSelectTab = useCallback(
    async (tabId: string) => {
      if (activeTabId && activeTabId !== tabId) {
        await flushTabSave(activeTabId);
      }
      setActiveTabId(tabId);
    },
    [activeTabId, flushTabSave],
  );

  const handleNextTab = useCallback(() => {
    if (!sortedTabs.length || !activeTabId) return;
    const index = sortedTabs.findIndex((tab) => tab.id === activeTabId);
    const next = sortedTabs[(index + 1) % sortedTabs.length];
    void handleSelectTab(next.id);
  }, [activeTabId, handleSelectTab, sortedTabs]);

  const handleLoadHistorySql = useCallback((sql: string) => {
    paneRef.current?.insertText(sql);
    paneRef.current?.focus();
  }, []);

  const schemaCompletions = useMemo(() => {
    const schema: Record<string, string[]> = {};
    for (const table of autocompleteQuery.data?.tables ?? []) {
      schema[table.name] = table.columns.map((column) => column.name);
    }
    return schema;
  }, [autocompleteQuery.data?.tables]);

  const isRunning = runTab.isPending;
  const canRun = Boolean(datasourceId && activeSql.trim());

  return {
    sessionQuery,
    session,
    sortedTabs,
    activeTabId,
    activeTab,
    activeSql,
    activeName,
    localTabs,
    getTabState,
    datasourceId,
    dbType,
    dialect,
    schemaCompletions,
    autocompleteTables: autocompleteQuery.data?.tables ?? [],
    autocompleteLoading: autocompleteQuery.isLoading,
    result,
    error,
    errorLine,
    paneRef,
    isRunning,
    canRun,
    setSql,
    setTabName,
    setDatasourceId,
    handleRenameSession,
    isSavingSession: updateSession.isPending,
    handleRun,
    handleFormat,
    handleCopy,
    handleInsertText,
    handleCreateTab,
    handleCloseTab,
    handleRenameTab,
    handleReorderTabs,
    handleSelectTab,
    handleNextTab,
    handleLoadHistorySql,
  };
}
