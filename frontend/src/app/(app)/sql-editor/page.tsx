"use client";

import {
  ArrowRight01Icon,
  CodeIcon,
  ConnectIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { useActiveDatasource } from "@/components/providers/datasource-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDatasources } from "@/hooks/use-datasource";
import {
  useCreateSqlEditorSession,
  useSqlEditorSessions,
} from "@/hooks/use-sql-editor";
import { sqlEditor } from "@/lib/microcopy";

function SqlEditorPage() {
  const { data: datasources, isLoading: datasourcesLoading } = useDatasources();
  const { data: sessions, isLoading: sessionsLoading } = useSqlEditorSessions();
  const { activeDatasourceId } = useActiveDatasource();
  const createSession = useCreateSqlEditorSession();

  const activeDatasources = datasources?.filter((item) => item.is_active) ?? [];
  const hasDatasource = activeDatasources.length > 0;
  const latestSession = sessions?.[0];
  const isLoading = datasourcesLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!hasDatasource) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={ConnectIcon}
          title="Hubungkan database dulu"
          description="SQL Editor butuh datasource aktif supaya autocomplete schema dan eksekusi query bisa jalan."
          action={
            <Button asChild>
              <Link href="/settings/datasources">
                Tambah datasource
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={CodeIcon}
        title={sqlEditor.pageTitle}
        description={sqlEditor.pageDescription}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              disabled={createSession.isPending}
              onClick={() =>
                createSession.mutate({
                  datasource_id: activeDatasourceId ?? undefined,
                })
              }
            >
              {createSession.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={CodeIcon} strokeWidth={2} />
              )}
              {sqlEditor.newSession}
            </Button>
            {latestSession ? (
              <Button variant="outline" asChild>
                <Link href={`/sql-editor/${latestSession.id}`}>
                  Lanjutkan sesi terakhir
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />
    </div>
  );
}

export default SqlEditorPage;
