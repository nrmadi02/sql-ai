"use client";

import { Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sqlEditor } from "@/lib/microcopy";
import { resolveSqlEditorSessionName } from "@/lib/sql-editor-utils";
import { cn } from "@/lib/utils";

type SqlEditorSessionTitleProps = {
  name?: string;
  onRename: (name: string) => void;
  isSaving?: boolean;
  className?: string;
};

function SqlEditorSessionTitle({
  name,
  onRename,
  isSaving = false,
  className,
}: SqlEditorSessionTitleProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const displayName = resolveSqlEditorSessionName(name);

  useEffect(() => {
    if (!editing) {
      setValue(displayName);
    }
  }, [displayName, editing]);

  const startEditing = () => {
    setValue(displayName === sqlEditor.untitledSession ? "" : displayName);
    setEditing(true);
  };

  const commitRename = () => {
    const next = value.trim();
    if (next && next !== displayName) {
      onRename(next);
    }
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-b border-border/50 bg-card/25 px-3 py-2",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
          {sqlEditor.sessionLabel}
        </span>

        {editing ? (
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitRename();
              if (event.key === "Escape") setEditing(false);
            }}
            placeholder={sqlEditor.renameSessionPlaceholder}
            disabled={isSaving}
            className="h-7 max-w-md min-w-[12rem] flex-1 px-2 font-medium text-sm tracking-tight"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onDoubleClick={startEditing}
            className={cn(
              "min-w-0 truncate text-left font-medium text-sm tracking-tight transition-colors",
              "hover:text-foreground/90",
              displayName === sqlEditor.untitledSession
                ? "text-muted-foreground"
                : "text-foreground",
            )}
            title={displayName}
          >
            {displayName}
          </button>
        )}

        {!editing ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={startEditing}
            disabled={isSaving}
            aria-label={sqlEditor.renameSession}
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <span className="hidden shrink-0 text-[0.6rem] text-muted-foreground/75 sm:inline">
        {sqlEditor.renameSessionHint}
      </span>
    </div>
  );
}

export { SqlEditorSessionTitle };