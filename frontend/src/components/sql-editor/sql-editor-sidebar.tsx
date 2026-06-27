"use client";

import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Key01Icon,
  Link04Icon,
  Search01Icon,
  TableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { sqlEditor } from "@/lib/microcopy";
import type { SqlEditorAutocompleteTable } from "@/lib/types";
import { cn } from "@/lib/utils";

type SqlEditorSidebarProps = {
  tables: SqlEditorAutocompleteTable[];
  isLoading?: boolean;
  onInsert: (text: string) => void;
};

function columnTypeLabel(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("int") || normalized.includes("numeric"))
    return "num";
  if (normalized.includes("timestamp") || normalized.includes("date"))
    return "date";
  if (normalized.includes("bool")) return "bool";
  return "txt";
}

function SqlEditorSidebar({
  tables,
  isLoading = false,
  onInsert,
}: SqlEditorSidebarProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tables;

    return tables
      .map((table) => {
        const tableMatch = table.name.toLowerCase().includes(query);
        const columns = table.columns.filter(
          (column) =>
            column.name.toLowerCase().includes(query) ||
            column.type.toLowerCase().includes(query),
        );

        if (tableMatch) return table;
        if (columns.length) return { ...table, columns };
        return null;
      })
      .filter((table): table is SqlEditorAutocompleteTable => table !== null);
  }, [search, tables]);

  const toggleTable = (tableName: string) => {
    setExpanded((current) => ({
      ...current,
      [tableName]: !current[tableName],
    }));
  };

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
          placeholder={sqlEditor.searchSchema}
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            {(["a", "b", "c", "d"] as const).map((id) => (
              <Skeleton key={id} className="h-8 w-full" />
            ))}
          </div>
        ) : filteredTables.length ? (
          <ul className="p-2">
            {filteredTables.map((table) => {
              const isOpen = expanded[table.name] ?? Boolean(search.trim());
              return (
                <li key={table.name} className="mb-1">
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-6 shrink-0"
                      onClick={() => toggleTable(table.name)}
                      aria-label={isOpen ? "Tutup" : "Buka"}
                    >
                      <HugeiconsIcon
                        icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon}
                        strokeWidth={2}
                        className="size-3"
                      />
                    </Button>
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
                      onClick={() => onInsert(table.name)}
                      title={`Insert ${table.name}`}
                    >
                      <HugeiconsIcon
                        icon={TableIcon}
                        strokeWidth={2}
                        className="size-3.5 shrink-0 text-primary"
                      />
                      <span className="truncate font-mono text-xs">
                        {table.name}
                      </span>
                    </button>
                  </div>

                  {isOpen ? (
                    <ul className="ml-7 border-l border-border/50 pl-2">
                      {table.columns.map((column) => (
                        <li key={`${table.name}.${column.name}`}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/40"
                            onClick={() =>
                              onInsert(`${table.name}.${column.name}`)
                            }
                            title={`Insert ${table.name}.${column.name}`}
                          >
                            <span className="rounded bg-muted px-1 font-mono text-[0.55rem] text-muted-foreground uppercase">
                              {columnTypeLabel(column.type)}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-mono text-[0.65rem]">
                              {column.name}
                            </span>
                            <span className="truncate text-muted-foreground text-[0.6rem]">
                              {column.type}
                            </span>
                            {column.type.toLowerCase().includes("uuid") ||
                            column.name === "id" ? (
                              <HugeiconsIcon
                                icon={Key01Icon}
                                strokeWidth={2}
                                className="size-3 shrink-0 text-amber-500"
                              />
                            ) : column.name.endsWith("_id") ? (
                              <HugeiconsIcon
                                icon={Link04Icon}
                                strokeWidth={2}
                                className="size-3 shrink-0 text-sky-500"
                              />
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-4 text-center text-muted-foreground text-xs leading-relaxed">
            {emptySchemaMessage(tables.length, search)}
          </p>
        )}
      </div>
    </div>
  );
}

function emptySchemaMessage(tableCount: number, search: string) {
  if (search.trim()) return "Tidak ada tabel atau kolom yang cocok.";
  if (tableCount === 0) {
    return "Schema belum tersedia. Pilih datasource dan sinkronkan schema di pengaturan.";
  }
  return "Tidak ada tabel.";
}

export { SqlEditorSidebar };
