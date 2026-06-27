"use client";

import { Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sqlEditor } from "@/lib/microcopy";
import type { SqlEditorTab } from "@/lib/types";
import { cn } from "@/lib/utils";

type SqlEditorTabBarProps = {
  tabs: SqlEditorTab[];
  activeTabId: string | null;
  getTabName: (tab: SqlEditorTab) => string;
  onSelectTab: (tabId: string) => void;
  onCreateTab: () => void;
  onCloseTab: (tabId: string) => void;
  onRenameTab: (tabId: string, name: string) => void;
  onReorderTabs: (orderedIds: string[]) => void;
  isCreating?: boolean;
};

function SqlEditorTabBar({
  tabs,
  activeTabId,
  getTabName,
  onSelectTab,
  onCreateTab,
  onCloseTab,
  onRenameTab,
  onReorderTabs,
  isCreating = false,
}: SqlEditorTabBarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const startRename = (tab: SqlEditorTab) => {
    setRenamingId(tab.id);
    setRenameValue(getTabName(tab));
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameTab(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;

    const ids = tabs.map((tab) => tab.id);
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...ids];
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, dragId);
    onReorderTabs(next);
    setDragId(null);
  };

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-border/60 bg-muted/10 px-2 py-1.5">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const name = getTabName(tab);

        return (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            draggable={renamingId !== tab.id}
            onDragStart={() => setDragId(tab.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(tab.id)}
            className={cn(
              "group flex max-w-[200px] shrink-0 items-center gap-1 rounded-md border px-2 py-1 transition-colors",
              isActive
                ? "border-border bg-card text-foreground shadow-xs"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40",
              dragId === tab.id && "opacity-50",
            )}
          >
            {renamingId === tab.id ? (
              <Input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitRename();
                  if (event.key === "Escape") setRenamingId(null);
                }}
                className="h-6 min-w-0 flex-1 px-1 font-mono text-xs"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left font-mono text-xs"
                onClick={() => onSelectTab(tab.id)}
                onDoubleClick={() => startRename(tab)}
                title={name}
              >
                {name}
              </button>
            )}

            {tabs.length > 1 ? (
              <button
                type="button"
                className="rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                onClick={() => onCloseTab(tab.id)}
                aria-label={sqlEditor.closeTab}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-3"
                />
              </button>
            ) : null}
          </div>
        );
      })}

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0"
        disabled={isCreating}
        onClick={onCreateTab}
        aria-label={sqlEditor.newTab}
      >
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
      </Button>
    </div>
  );
}

export { SqlEditorTabBar };
