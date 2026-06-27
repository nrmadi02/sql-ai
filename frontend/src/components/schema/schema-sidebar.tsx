"use client";

import { Database02Icon, TableIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useActiveDatasource } from "@/components/providers/datasource-provider";
import { TablePreviewSheet } from "@/components/schema/table-preview-sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useDatasources } from "@/hooks/use-datasource";
import { useSchemaTables, useSyncSchema } from "@/hooks/use-schema";
import { buttons } from "@/lib/microcopy";
import { cn } from "@/lib/utils";

function SchemaSidebar() {
  const pathname = usePathname();
  const { data: datasources, isLoading: datasourcesLoading } = useDatasources();
  const { activeDatasourceId, setActiveDatasourceId } = useActiveDatasource();
  const tablesQuery = useSchemaTables(activeDatasourceId);
  const syncMutation = useSyncSchema(activeDatasourceId ?? "");
  const [previewTable, setPreviewTable] = useState<string | null>(null);

  const activeDatasources = datasources?.filter((item) => item.is_active) ?? [];

  useEffect(() => {
    if (!activeDatasourceId && activeDatasources.length === 1) {
      setActiveDatasourceId(activeDatasources[0].id);
    }
  }, [activeDatasourceId, activeDatasources, setActiveDatasourceId]);

  const schemaNotCached =
    tablesQuery.isError &&
    tablesQuery.error.message.toLowerCase().includes("schema not cached");

  const isGeneratorRoute =
    pathname === "/generator" || pathname.startsWith("/generator/");

  if (!isGeneratorRoute) {
    return null;
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Schema</SidebarGroupLabel>
        <SidebarGroupContent className="flex min-w-0 flex-col gap-3">
          {datasourcesLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : activeDatasources.length ? (
            <Select
              value={activeDatasourceId ?? undefined}
              onValueChange={setActiveDatasourceId}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Pilih datasource" />
              </SelectTrigger>
              <SelectContent>
                {activeDatasources.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
              <p className="text-muted-foreground text-xs leading-relaxed">
                Belum ada datasource aktif.
              </p>
              <Button
                asChild
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0 text-xs"
              >
                <Link href="/settings/datasources">Tambah datasource</Link>
              </Button>
            </div>
          )}

          {activeDatasourceId ? (
            tablesQuery.isLoading ? (
              <div className="flex flex-col gap-1.5 px-1">
                {(["a", "b", "c", "d"] as const).map((id) => (
                  <Skeleton key={id} className="h-8 w-full" />
                ))}
              </div>
            ) : schemaNotCached ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Schema belum tersedia. Sinkronkan dulu supaya daftar tabel
                  muncul.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  disabled={syncMutation.isPending}
                  onClick={() => syncMutation.mutate()}
                >
                  {syncMutation.isPending ? (
                    <Spinner className="size-4" />
                  ) : (
                    <HugeiconsIcon icon={Database02Icon} strokeWidth={2} />
                  )}
                  {buttons.syncSchema}
                </Button>
              </div>
            ) : tablesQuery.isError ? (
              <p className="px-1 text-destructive text-xs">
                {tablesQuery.error.message}
              </p>
            ) : tablesQuery.data?.tables.length ? (
              <ScrollArea className="max-h-[min(50vh,320px)]">
                <SidebarMenu>
                  {tablesQuery.data.tables.map((table) => {
                    const meta =
                      `${table.column_count} kolom` +
                      (table.estimated_rows != null
                        ? ` · ~${table.estimated_rows.toLocaleString("id-ID")} baris`
                        : "");
                    return (
                      <SidebarMenuItem key={table.name}>
                        <SidebarMenuButton
                          tooltip={table.name}
                          className={cn(
                            "h-auto py-2",
                            previewTable === table.name && "bg-accent",
                          )}
                          onClick={() => setPreviewTable(table.name)}
                        >
                          <HugeiconsIcon icon={TableIcon} strokeWidth={2} />
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                            <span
                              className="w-full truncate font-mono text-xs"
                              title={table.name}
                            >
                              {table.name}
                            </span>
                            <span
                              className="w-full truncate text-muted-foreground text-[0.65rem]"
                              title={meta}
                            >
                              {meta}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </ScrollArea>
            ) : (
              <p className="px-1 text-muted-foreground text-xs">
                Tidak ada tabel di datasource ini.
              </p>
            )
          ) : null}
        </SidebarGroupContent>
      </SidebarGroup>

      <TablePreviewSheet
        datasourceId={activeDatasourceId}
        tableName={previewTable}
        open={Boolean(previewTable)}
        onOpenChange={(open) => !open && setPreviewTable(null)}
      />
    </>
  );
}

export { SchemaSidebar };
