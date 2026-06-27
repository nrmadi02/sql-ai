"use client";

import { SentIcon, TableIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useActiveDatasource } from "@/components/providers/datasource-provider";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useSchemaTables } from "@/hooks/use-schema";
import {
  detectTableMentionQuery,
  insertTableMention,
  parseReferencedTables,
} from "@/lib/generator-utils";
import { buttons, generator } from "@/lib/microcopy";
import { cn } from "@/lib/utils";
import { TableMention } from "./table-mention";

type GeneratorInputProps = {
  onSend: (content: string, tables: string[]) => void;
  disabled?: boolean;
  isStreaming?: boolean;
};

function GeneratorInput({
  onSend,
  disabled = false,
  isStreaming = false,
}: GeneratorInputProps) {
  const { activeDatasourceId } = useActiveDatasource();
  const tablesQuery = useSchemaTables(activeDatasourceId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [cursor, setCursor] = useState(0);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mentionListRef = useRef<HTMLDivElement>(null);
  const keyboardNavRef = useRef(false);
  const prevMentionQueryRef = useRef("");

  const referencedTables = useMemo(() => parseReferencedTables(value), [value]);

  const tableOptions = useMemo(() => {
    const tables = tablesQuery.data?.tables ?? [];
    const query = mentionQuery.toLowerCase();
    return tables
      .map((table) => table.name)
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [mentionQuery, tablesQuery.data?.tables]);

  const updateMentionState = useCallback(
    (nextValue: string, nextCursor: number) => {
      const mention = detectTableMentionQuery(nextValue, nextCursor);
      if (mention) {
        if (prevMentionQueryRef.current !== mention.query) {
          prevMentionQueryRef.current = mention.query;
          setSelectedIndex(0);
        }
        setMentionOpen(true);
        setMentionQuery(mention.query);
        setMentionStart(mention.start);
      } else {
        prevMentionQueryRef.current = "";
        setMentionOpen(false);
        setMentionQuery("");
        setSelectedIndex(0);
      }
    },
    [],
  );

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    const nextCursor = textareaRef.current?.selectionStart ?? nextValue.length;
    setCursor(nextCursor);
    updateMentionState(nextValue, nextCursor);
  };

  const handleSelectTable = (tableName: string) => {
    const { nextValue, nextCursor } = insertTableMention(
      value,
      mentionStart,
      cursor,
      tableName,
    );
    setValue(nextValue);
    setCursor(nextCursor);
    setMentionOpen(false);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed, referencedTables);
    setValue("");
    setMentionOpen(false);
    setMentionQuery("");
  };

  const moveSelection = (direction: 1 | -1) => {
    keyboardNavRef.current = true;
    setSelectedIndex((index) => {
      const next = index + direction;
      if (next < 0) return tableOptions.length - 1;
      if (next >= tableOptions.length) return 0;
      return next;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && tableOptions.length) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection(-1);
        return;
      }
      if (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey)) {
        event.preventDefault();
        handleSelectTable(tableOptions[selectedIndex] ?? tableOptions[0]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMentionOpen(false);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const NAVIGATION_KEYS = new Set([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Enter",
      "Escape",
    ]);

    const handleSelection = () => {
      const nextCursor = textarea.selectionStart;
      setCursor(nextCursor);
      updateMentionState(value, nextCursor);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (NAVIGATION_KEYS.has(event.key)) return;
      handleSelection();
    };

    textarea.addEventListener("click", handleSelection);
    textarea.addEventListener("keyup", handleKeyUp);
    return () => {
      textarea.removeEventListener("click", handleSelection);
      textarea.removeEventListener("keyup", handleKeyUp);
    };
  }, [updateMentionState, value]);

  useEffect(() => {
    if (!mentionOpen || !tableOptions.length) return;
    setSelectedIndex((index) => Math.min(index, tableOptions.length - 1));
  }, [mentionOpen, tableOptions]);

  useEffect(() => {
    if (!mentionOpen) return;
    const selected = mentionListRef.current?.querySelector(
      `[data-mention-index="${selectedIndex}"]`,
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [mentionOpen, selectedIndex, tableOptions]);

  return (
    <div className="sticky bottom-0 z-10 shrink-0 border-t border-border/60 bg-background/95 p-4 backdrop-blur-sm supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {referencedTables.length ? (
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-muted-foreground text-[0.65rem]">
              {generator.tableMentionLabel}
            </span>
            <TableMention tables={referencedTables} />
          </div>
        ) : null}

        <div className="relative">
          {mentionOpen ? (
            <div
              ref={mentionListRef}
              className="absolute right-0 bottom-full left-0 z-20 mb-2 overflow-hidden rounded-xl border border-border/70 bg-popover shadow-md"
            >
              <Command
                shouldFilter={false}
                value={tableOptions[selectedIndex] ?? ""}
                onValueChange={(table) => {
                  const index = tableOptions.indexOf(table);
                  if (index >= 0) setSelectedIndex(index);
                }}
              >
                <CommandList>
                  <CommandEmpty>Tabel tidak ditemukan.</CommandEmpty>
                  <CommandGroup heading="Tabel schema">
                    {tableOptions.map((table, index) => (
                      <CommandItem
                        key={table}
                        value={table}
                        data-mention-index={index}
                        className={cn(
                          index === selectedIndex &&
                            "bg-muted text-foreground",
                        )}
                        onMouseEnter={() => {
                          if (keyboardNavRef.current) return;
                          setSelectedIndex(index);
                        }}
                        onMouseMove={() => {
                          keyboardNavRef.current = false;
                        }}
                        onSelect={() => handleSelectTable(table)}
                      >
                        <HugeiconsIcon icon={TableIcon} strokeWidth={2} />
                        <span className="font-mono text-xs">/{table}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          ) : null}

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={generator.inputPlaceholder}
            disabled={disabled || isStreaming}
            rows={3}
            className={cn(
              "min-h-[88px] resize-none rounded-md bg-muted/30 text-sm leading-relaxed",
              "focus-visible:ring-2 focus-visible:ring-ring/40",
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-[0.65rem] leading-relaxed">
            {generator.inputHint}
          </p>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!value.trim() || disabled || isStreaming}
            className="shrink-0 active:scale-[0.98]"
          >
            {isStreaming ? (
              <Spinner className="size-4" />
            ) : (
              <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
            )}
            {buttons.send}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { GeneratorInput };
