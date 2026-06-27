"use client";

import { QueryWorkspaceDialog } from "@/components/query/query-workspace-dialog";
import { useStandaloneQuery } from "@/hooks/use-standalone-query";

type StandaloneQueryWorkspaceProps = {
  initialSql?: string;
  initialDatasourceId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autoRun?: boolean;
};

function StandaloneQueryWorkspace({
  initialSql,
  initialDatasourceId,
  open,
  onOpenChange,
  autoRun = false,
}: StandaloneQueryWorkspaceProps) {
  const workspace = useStandaloneQuery({
    initialSql,
    initialDatasourceId,
    autoRun,
  });

  return (
    <QueryWorkspaceDialog
      open={open}
      onOpenChange={onOpenChange}
      sql={workspace.sql}
      onSqlChange={workspace.setSql}
      dbType={workspace.dbType}
      datasourceId={workspace.datasourceId}
      onRun={workspace.handleRun}
      isRunning={workspace.isRunning}
      canRun={workspace.canRun}
      error={workspace.error}
      result={workspace.result}
    />
  );
}

export { StandaloneQueryWorkspace };
