"use client";

import {
  ConnectIcon,
  Delete02Icon,
  Edit02Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useDatasources,
  useDeleteDatasource,
  useTestDatasourceConnection,
} from "@/hooks/use-datasource";
import { buttons } from "@/lib/microcopy";
import type { Datasource } from "@/lib/types";
import { cn } from "@/lib/utils";

type DatasourceListProps = {
  selectedId?: string | null;
  onSelect?: (datasource: Datasource) => void;
  className?: string;
};

function DatasourceListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {(["a", "b", "c"] as const).map((id) => (
        <div
          key={id}
          className="rounded-xl border border-border/60 bg-card/50 p-4"
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-56" />
          <Skeleton className="mt-3 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

function DatasourceList({
  selectedId,
  onSelect,
  className,
}: DatasourceListProps) {
  const { data, isLoading, isError, error, refetch } = useDatasources();
  const deleteMutation = useDeleteDatasource();
  const testMutation = useTestDatasourceConnection();
  const [deleteTarget, setDeleteTarget] = useState<Datasource | null>(null);

  if (isLoading) {
    return <DatasourceListSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium">Gagal memuat datasource</p>
        <p className="mt-1 text-muted-foreground text-sm">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => refetch()}
        >
          Coba lagi
        </Button>
      </div>
    );
  }

  if (!data?.length) {
    return null;
  }

  return (
    <>
      <div className={cn("flex flex-col gap-2", className)}>
        {data.map((item) => {
          const isSelected = selectedId === item.id;
          const isTesting =
            testMutation.isPending &&
            testMutation.variables?.datasourceId === item.id;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect?.(item);
                }
              }}
              className={cn(
                "group w-full cursor-pointer rounded-xl border p-4 text-left transition-colors",
                "hover:border-primary/30 hover:bg-accent/30",
                "active:scale-[0.995]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/60 bg-card/50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-sm">{item.name}</p>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate font-mono text-muted-foreground text-xs">
                    {item.db_type} · {item.host}:{item.port}/
                    {item.database_name}
                  </p>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {item.table_count} tabel · ditambahkan{" "}
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <HugeiconsIcon
                        icon={MoreHorizontalIcon}
                        strokeWidth={2}
                      />
                      <span className="sr-only">Aksi datasource</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect?.(item);
                      }}
                    >
                      <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                      Ubah
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={isTesting}
                      onClick={(event) => {
                        event.stopPropagation();
                        testMutation.mutate({
                          values: {
                            name: item.name,
                            db_type: item.db_type,
                            host: item.host,
                            port: item.port,
                            database_name: item.database_name,
                            username: item.username,
                            password: "",
                            ssl_mode: "disable",
                          },
                          datasourceId: item.id,
                        });
                      }}
                    >
                      {isTesting ? (
                        <Spinner className="size-4" />
                      ) : (
                        <HugeiconsIcon icon={ConnectIcon} strokeWidth={2} />
                      )}
                      {buttons.testConnection}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(item);
                      }}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                      {buttons.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus datasource?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} akan dihapus permanen. Query tersimpan yang
              terkait tidak bisa dijalankan lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{buttons.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteMutation.mutateAsync(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              {deleteMutation.isPending ? <Spinner className="size-4" /> : null}
              {buttons.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export { DatasourceList, DatasourceListSkeleton };
