"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SqlEditorWorkspace } from "@/components/sql-editor/sql-editor-workspace";
import { Spinner } from "@/components/ui/spinner";

function SqlEditorSessionContent() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId;
  const initialSql = searchParams.get("sql") ?? undefined;

  if (!sessionId) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SqlEditorWorkspace sessionId={sessionId} initialSql={initialSql} />
    </div>
  );
}

function SqlEditorSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-6" />
        </div>
      }
    >
      <SqlEditorSessionContent />
    </Suspense>
  );
}

export default SqlEditorSessionPage;
