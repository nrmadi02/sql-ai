"use client";

import type * as React from "react";
import { Add01Icon, CodeIcon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useActiveDatasource } from "@/components/providers/datasource-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useCreateSqlEditorSession,
  useDeleteSqlEditorSession,
  useRenameSqlEditorSession,
  useSqlEditorSessions,
} from "@/hooks/use-sql-editor";
import { buttons, sqlEditor } from "@/lib/microcopy";
import { resolveSqlEditorSessionName } from "@/lib/sql-editor-utils";
import type { SqlEditorSession } from "@/lib/types";
import { cn } from "@/lib/utils";

type SqlEditorSessionsSheetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

type SqlEditorSessionListItemProps = {
  session: SqlEditorSession;
  isActive: boolean;
  onNavigate?: () => void;
  onRename: (sessionId: string, name: string, datasourceId?: string) => void;
  onDelete: (sessionId: string) => void;
  isRenaming: boolean;
  isDeleting: boolean;
};

function SqlEditorSessionListItem({
  session,
  isActive,
  onNavigate,
  onRename,
  onDelete,
  isRenaming,
  isDeleting,
}: SqlEditorSessionListItemProps) {
  const [editing, setEditing] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const href = `/sql-editor/${session.id}`;
  const title = resolveSqlEditorSessionName(session.name);

  const startRename = () => {
    setRenameValue(title === sqlEditor.untitledSession ? "" : title);
    setEditing(true);
  };

  const commitRename = () => {
    const next = renameValue.trim();
    if (next && next !== title) {
      onRename(session.id, next, session.datasource_id);
    }
    setEditing(false);
  };

  return (
    <li className="group">
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg border px-2 py-2 transition-colors",
          isActive
            ? "border-border bg-card shadow-xs"
            : "border-transparent hover:border-border/60 hover:bg-muted/30",
        )}
      >
        {editing ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
            <HugeiconsIcon
              icon={CodeIcon}
              strokeWidth={2}
              className="size-4 shrink-0 text-primary"
            />
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitRename();
                if (event.key === "Escape") setEditing(false);
              }}
              placeholder={sqlEditor.renameSessionPlaceholder}
              disabled={isRenaming}
              className="h-8 min-w-0 flex-1 text-sm"
              autoFocus
            />
          </div>
        ) : (
          <>
            <Link
              href={href}
              onClick={() => onNavigate?.()}
              className="flex min-w-0 flex-1 items-start gap-2.5"
            >
              <HugeiconsIcon
                icon={CodeIcon}
                strokeWidth={2}
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm",
                    title === sqlEditor.untitledSession
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                  title={title}
                >
                  {title}
                </p>
                <p className="truncate text-[0.65rem] text-muted-foreground">
                  {formatDistanceToNow(
                    new Date(session.updated_at ?? session.created_at),
                    { addSuffix: true, locale: localeId },
                  )}
                </p>
              </div>
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={startRename}
              disabled={isRenaming}
              aria-label={sqlEditor.renameSession}
            >
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            </Button>
          </>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`Hapus ${title}`}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus sesi editor?</AlertDialogTitle>
              <AlertDialogDescription>
                Semua tab di sesi ini akan hilang. Tindakan ini tidak bisa
                dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{buttons.cancel}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={() => onDelete(session.id)}
              >
                {buttons.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}

function SqlEditorSessionsList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { activeDatasourceId } = useActiveDatasource();
  const sessionsQuery = useSqlEditorSessions();
  const createSession = useCreateSqlEditorSession();
  const deleteSession = useDeleteSqlEditorSession();
  const renameSession = useRenameSqlEditorSession();

  const handleCreateSession = () => {
    createSession.mutate(
      { datasource_id: activeDatasourceId ?? undefined },
      { onSuccess: () => onNavigate?.() },
    );
  };

  if (sessionsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-2 px-1">
        {(["a", "b", "c"] as const).map((id) => (
          <Skeleton key={id} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!sessionsQuery.data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 p-4">
        <p className="text-muted-foreground text-xs leading-relaxed">
          {sqlEditor.noSessions}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={createSession.isPending}
          onClick={handleCreateSession}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          {sqlEditor.newSession}
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {sessionsQuery.data.map((session) => {
        const href = `/sql-editor/${session.id}`;
        const isActive = pathname === href;

        return (
          <SqlEditorSessionListItem
            key={session.id}
            session={session}
            isActive={isActive}
            onNavigate={onNavigate}
            onRename={(sessionId, name, datasourceId) =>
              renameSession.mutate({
                sessionId,
                name,
                datasource_id: datasourceId,
              })
            }
            onDelete={(sessionId) => deleteSession.mutate(sessionId)}
            isRenaming={renameSession.isPending}
            isDeleting={deleteSession.isPending}
          />
        );
      })}
    </ul>
  );
}

function SqlEditorSessionsSheet({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: SqlEditorSessionsSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent side="left" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="border-b border-border/60 pb-4">
          <SheetTitle>Sesi editor</SheetTitle>
          <SheetDescription>
            Pilih sesi yang ada, ganti nama, atau buat sesi baru.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          <SqlEditorSessionsList onNavigate={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SqlEditorSessionsSheetTrigger() {
  return (
    <SqlEditorSessionsSheet
      trigger={
        <Button type="button" variant="outline" size="sm">
          <HugeiconsIcon icon={CodeIcon} strokeWidth={2} />
          {sqlEditor.openSessions}
        </Button>
      }
    />
  );
}

export {
  SqlEditorSessionsSheet,
  SqlEditorSessionsList,
  SqlEditorSessionsSheetTrigger,
};