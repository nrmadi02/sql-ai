"use client";

import {
  Clock01Icon,
  Copy01Icon,
  FloppyDiskIcon,
  LeftToRightListDashIcon,
  PlayIcon,
  TableIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { SaveQueryDialog } from "@/components/query/save-query-dialog";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useDatasources } from "@/hooks/use-datasource";
import { buttons, sqlEditor } from "@/lib/microcopy";
import { cn } from "@/lib/utils";

type SqlEditorToolbarProps = {
  datasourceId: string | null;
  onDatasourceChange: (id: string | null) => void;
  onRun: () => void;
  onCopy: () => void;
  onFormat: () => void;
  onOpenSchema?: () => void;
  onOpenHistory?: () => void;
  isRunning?: boolean;
  canRun?: boolean;
  sql: string;
  className?: string;
};

function SqlEditorToolbar({
  datasourceId,
  onDatasourceChange,
  onRun,
  onCopy,
  onFormat,
  onOpenSchema,
  onOpenHistory,
  isRunning = false,
  canRun = false,
  sql,
  className,
}: SqlEditorToolbarProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const { data: datasources } = useDatasources();
  const activeDatasources = datasources?.filter((item) => item.is_active) ?? [];

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-card/50 px-3 py-2",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={datasourceId ?? undefined}
            onValueChange={(value) => onDatasourceChange(value)}
          >
            <SelectTrigger className="h-8 w-[min(220px,40vw)] text-xs">
              <SelectValue placeholder={sqlEditor.selectDatasource} />
            </SelectTrigger>
            <SelectContent>
              {activeDatasources.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            size="sm"
            onClick={onRun}
            disabled={!canRun || isRunning}
          >
            {isRunning ? (
              <Spinner className="size-3.5" />
            ) : (
              <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />
            )}
            {buttons.run}
            <Kbd className="ml-1 hidden sm:inline-flex">⌘↵</Kbd>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!sql.trim()}
            onClick={() => setSaveOpen(true)}
          >
            <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
            {buttons.save}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!sql.trim()}
            onClick={onCopy}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            {buttons.copy}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!sql.trim()}
            onClick={onFormat}
          >
            <HugeiconsIcon icon={LeftToRightListDashIcon} strokeWidth={2} />
            {sqlEditor.formatSql}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onOpenSchema}
          >
            <HugeiconsIcon icon={TableIcon} strokeWidth={2} />
            {sqlEditor.openSchema}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onOpenHistory}
          >
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
            {sqlEditor.openHistory}
          </Button>
        </div>
      </div>

      <SaveQueryDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        sql={sql}
        datasourceId={datasourceId ?? undefined}
      />
    </>
  );
}

export { SqlEditorToolbar };
