"use client";

import type * as React from "react";
import { FeatureSheetBar } from "@/components/layout/feature-sheet-bar";
import { SqlEditorSessionsSheetTrigger } from "@/components/sql-editor/sql-editor-sessions-sheet";
import { sqlEditor } from "@/lib/microcopy";

type SqlEditorShellProps = {
  children: React.ReactNode;
};

function SqlEditorShell({ children }: SqlEditorShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <FeatureSheetBar
        title={sqlEditor.pageTitle}
        actions={<SqlEditorSessionsSheetTrigger />}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export { SqlEditorShell };
