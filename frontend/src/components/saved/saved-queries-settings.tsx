"use client";

import {
  Bookmark01Icon,
  CodeIcon,
  Delete02Icon,
  PlayIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StandaloneQueryWorkspace } from "@/components/query/standalone-query-workspace";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpenInSqlEditor } from "@/hooks/use-sql-editor";
import { useDeleteSavedQuery, useSavedQueries } from "@/hooks/use-saved-query";
import { buttons, saved } from "@/lib/microcopy";
import { previewSql } from "@/lib/query-utils";
import type { SavedQuery } from "@/lib/types";
import { cn } from "@/lib/utils";

function SavedQuerySkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

function SavedQueriesSettings() {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [autoRunOnOpen, setAutoRunOnOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedQuery | null>(null);

  const { data, isLoading } = useSavedQueries(search, tagFilter);
  const deleteMutation = useDeleteSavedQuery();
  const openInEditor = useOpenInSqlEditor();

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const item of data ?? []) {
      for (const tag of item.tags) tags.add(tag);
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b, "id"));
  }, [data]);

  const openQuery = (query: SavedQuery, autoRun = false) => {
    setSelectedQuery(query);
    setAutoRunOnOpen(autoRun);
    setWorkspaceOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const hasItems = Boolean(data?.length);
  const showFilteredEmpty = !isLoading && !hasItems && (search || tagFilter);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {saved.pageTitle}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {saved.pageDescription}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={saved.searchPlaceholder}
            className="pl-9"
          />
        </div>
        <Select
          value={tagFilter || "all"}
          onValueChange={(value) => setTagFilter(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={saved.tagFilterPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{saved.allTags}</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {["a", "b", "c", "d", "e", "f"].map((id) => (
              <SavedQuerySkeleton key={`saved-skeleton-${id}`} />
            ))}
          </div>
        ) : !hasItems ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/15 py-16">
            <EmptyState
              icon={Bookmark01Icon}
              title={
                showFilteredEmpty
                  ? saved.noResults
                  : "Belum ada query tersimpan"
              }
              description={
                showFilteredEmpty
                  ? "Coba ubah kata kunci atau filter tag."
                  : "Simpan query yang sering dipakai agar bisa dijalankan ulang tanpa menulis ulang dari nol."
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data?.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "group flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-4",
                  "transition-colors hover:border-border hover:bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-heading text-sm font-semibold">
                      {item.name}
                    </h2>
                    {item.description ? (
                      <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={buttons.delete}
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => openQuery(item)}
                  className="cursor-pointer rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/35"
                >
                  <pre className="line-clamp-3 overflow-hidden font-mono text-[0.65rem] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {previewSql(item.sql_content, 3)}
                  </pre>
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={`${item.id}-${tag}`} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="font-mono text-muted-foreground text-[0.65rem]">
                    {formatDistanceToNow(new Date(item.updated_at), {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={openInEditor.isPending}
                    onClick={() =>
                      openInEditor.mutate({
                        sql: item.sql_content,
                        datasourceId: item.datasource_id,
                        name: item.name,
                      })
                    }
                  >
                    <HugeiconsIcon icon={CodeIcon} strokeWidth={2} />
                    {saved.openQuery}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={() => openQuery(item, true)}
                  >
                    <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />
                    {buttons.run}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedQuery ? (
        <StandaloneQueryWorkspace
          key={`${selectedQuery.id}-${autoRunOnOpen}`}
          initialSql={selectedQuery.sql_content}
          initialDatasourceId={selectedQuery.datasource_id}
          open={workspaceOpen}
          onOpenChange={(open) => {
            setWorkspaceOpen(open);
            if (!open) setAutoRunOnOpen(false);
          }}
          autoRun={autoRunOnOpen}
        />
      ) : null}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{saved.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              Query &quot;{deleteTarget?.name}&quot; akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{buttons.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {buttons.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { SavedQueriesSettings };
