"use client";

import { CodeIcon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { QueryResult } from "@/components/query/query-result";
import { SqlEditorHistory } from "@/components/sql-editor/sql-editor-history";
import { SqlEditorPane } from "@/components/sql-editor/sql-editor-pane";
import { SqlEditorSessionTitle } from "@/components/sql-editor/sql-editor-session-title";
import { SqlEditorSidebar } from "@/components/sql-editor/sql-editor-sidebar";
import { SqlEditorStatusBar } from "@/components/sql-editor/sql-editor-status-bar";
import { SqlEditorTabBar } from "@/components/sql-editor/sql-editor-tab-bar";
import { SqlEditorToolbar } from "@/components/sql-editor/sql-editor-toolbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useDatasources } from "@/hooks/use-datasource";
import { useSqlEditorWorkspace } from "@/hooks/use-sql-editor-workspace";
import { query, sqlEditor } from "@/lib/microcopy";
import { cn } from "@/lib/utils";

type SqlEditorWorkspaceProps = {
  sessionId: string;
  initialSql?: string;
};

function QueryResultSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={`result-row-${index}`} className="h-8 w-full" />
      ))}
    </div>
  );
}

function SqlEditorWorkspace({
  sessionId,
  initialSql,
}: SqlEditorWorkspaceProps) {
  const { data: datasources } = useDatasources();
  const workspace = useSqlEditorWorkspace({ sessionId, initialSql });
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeDatasource = datasources?.find(
    (item) => item.id === workspace.datasourceId,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;

      if (event.key === "t") {
        event.preventDefault();
        void workspace.handleCreateTab();
      } else if (event.key === "w") {
        event.preventDefault();
        if (workspace.activeTabId) {
          void workspace.handleCloseTab(workspace.activeTabId);
        }
      } else if (event.key === "Tab") {
        event.preventDefault();
        workspace.handleNextTab();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [workspace]);

  const handleLoadHistorySql = (sql: string) => {
    workspace.handleLoadHistorySql(sql);
    setHistoryOpen(false);
  };

  const handleSchemaInsert = (text: string) => {
    workspace.handleInsertText(text);
    workspace.paneRef.current?.focus();
  };

  if (workspace.sessionQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!workspace.session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={CodeIcon}
          title="Sesi tidak ditemukan"
          description="Sesi editor ini mungkin sudah dihapus. Buka daftar sesi dari toolbar atas."
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <SqlEditorSessionTitle
          name={workspace.session.name}
          onRename={workspace.handleRenameSession}
          isSaving={workspace.isSavingSession}
        />

        <SqlEditorTabBar
          tabs={workspace.sortedTabs}
          activeTabId={workspace.activeTabId}
          getTabName={(tab) => workspace.getTabState(tab).name || tab.name}
          onSelectTab={workspace.handleSelectTab}
          onCreateTab={() => void workspace.handleCreateTab()}
          onCloseTab={(tabId) => void workspace.handleCloseTab(tabId)}
          onRenameTab={workspace.handleRenameTab}
          onReorderTabs={(ids) => void workspace.handleReorderTabs(ids)}
          isCreating={workspace.sessionQuery.isFetching}
        />

        <SqlEditorToolbar
          datasourceId={workspace.datasourceId}
          onDatasourceChange={workspace.setDatasourceId}
          onRun={() => void workspace.handleRun()}
          onCopy={() => void workspace.handleCopy()}
          onFormat={workspace.handleFormat}
          onOpenSchema={() => setSchemaOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          isRunning={workspace.isRunning}
          canRun={workspace.canRun}
          sql={workspace.activeSql}
        />

        <div className="relative min-h-0 flex-1 basis-0">
          <ResizablePanelGroup
            id="sql-editor-editor-results-split"
            orientation="vertical"
            className="absolute inset-0 min-h-0"
          >
            <ResizablePanel
              id="sql-editor-editor-panel"
              defaultSize={45}
              minSize={24}
            >
              <div className="flex h-full min-h-0 flex-col">
                <SqlEditorPane
                  ref={workspace.paneRef}
                  value={workspace.activeSql}
                  dbType={workspace.dbType}
                  schema={workspace.schemaCompletions}
                  errorLine={workspace.errorLine}
                  onChange={workspace.setSql}
                  onRun={() => void workspace.handleRun()}
                  onFormat={workspace.handleFormat}
                  className="h-full border-0"
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
              id="sql-editor-results-panel"
              defaultSize={55}
              minSize={20}
            >
              <div className="flex h-full min-h-0 flex-col overflow-hidden bg-muted/10">
                {workspace.error ? (
                  <p className="shrink-0 border-b border-destructive/20 bg-destructive/5 px-4 py-2.5 text-destructive text-xs leading-relaxed">
                    {workspace.error}
                  </p>
                ) : null}

                <div className="min-h-0 flex-1 overflow-hidden">
                  {workspace.isRunning ? (
                    <div className="flex h-full min-h-0 flex-col">
                      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-4 py-3 text-muted-foreground text-xs">
                        <Spinner className="size-3.5" />
                        {query.running}
                      </div>
                      <QueryResultSkeleton />
                    </div>
                  ) : workspace.result ? (
                    <QueryResult
                      result={workspace.result}
                      className="h-full min-h-0"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 py-10">
                      <p
                        className={cn(
                          "max-w-sm text-center text-sm leading-relaxed",
                          workspace.datasourceId
                            ? "text-muted-foreground"
                            : "text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {workspace.datasourceId
                          ? workspace.activeSql.trim()
                            ? query.waitingResult
                            : sqlEditor.emptyEditor
                          : sqlEditor.selectDatasource}
                      </p>
                    </div>
                  )}
                </div>

                <SqlEditorStatusBar
                  datasourceName={activeDatasource?.name}
                  dialect={workspace.dialect}
                  executionTimeMs={workspace.result?.execution_time_ms}
                  rowCount={workspace.result?.row_count}
                  truncated={workspace.result?.truncated}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      <Sheet open={schemaOpen} onOpenChange={setSchemaOpen}>
        <SheetContent side="left" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader className="border-b border-border/60 pb-4">
            <SheetTitle>{sqlEditor.schemaPanel}</SheetTitle>
            <SheetDescription>
              {sqlEditor.schemaSheetDescription}
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-2">
            <SqlEditorSidebar
              tables={workspace.autocompleteTables}
              isLoading={workspace.autocompleteLoading}
              onInsert={handleSchemaInsert}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader className="border-b border-border/60 pb-4">
            <SheetTitle>{sqlEditor.historyPanel}</SheetTitle>
            <SheetDescription>
              {sqlEditor.historySheetDescription}
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-2">
            <SqlEditorHistory onLoadSql={handleLoadHistorySql} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { SqlEditorWorkspace };
