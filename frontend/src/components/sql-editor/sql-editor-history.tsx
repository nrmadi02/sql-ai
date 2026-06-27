"use client";

import { Clock01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryHistory } from "@/hooks/use-query-history";
import { history, sqlEditor } from "@/lib/microcopy";
import { previewSql } from "@/lib/query-utils";
import { cn } from "@/lib/utils";

type SqlEditorHistoryProps = {
  onLoadSql: (sql: string) => void;
};

function SqlEditorHistory({ onLoadSql }: SqlEditorHistoryProps) {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQueryHistory({
    source: "editor",
    pageSize: 50,
  });

  const items = useMemo(() => {
    const list = data?.items ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((entry) =>
      entry.sql_content.toLowerCase().includes(query),
    );
  }, [data?.items, search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative border-b border-border/60 px-3 py-2">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={sqlEditor.historySearch}
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            {(["a", "b", "c"] as const).map((id) => (
              <Skeleton key={id} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length ? (
          <ul className="space-y-1 p-2">
            {items.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onLoadSql(entry.sql_content)}
                  className={cn(
                    "w-full rounded-lg border border-border/50 bg-card/60 p-2.5 text-left transition-colors",
                    "hover:border-border hover:bg-card",
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        entry.status === "success" ? "secondary" : "destructive"
                      }
                      className="font-mono text-[0.6rem]"
                    >
                      {entry.status === "success"
                        ? history.statusSuccess
                        : history.statusFailed}
                    </Badge>
                    <span className="font-mono text-muted-foreground text-[0.6rem]">
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                        locale: localeId,
                      })}
                    </span>
                  </div>
                  <pre className="line-clamp-3 font-mono text-[0.65rem] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {previewSql(entry.sql_content, 4)}
                  </pre>
                  {entry.execution_time_ms != null ? (
                    <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">
                      {entry.execution_time_ms} ms
                      {entry.row_count != null
                        ? ` · ${entry.row_count.toLocaleString("id-ID")} baris`
                        : ""}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              className="size-8 text-muted-foreground/50"
            />
            <p className="text-muted-foreground text-xs leading-relaxed">
              {sqlEditor.historyEmpty}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export { SqlEditorHistory };
