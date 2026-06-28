"use client";

import {
  Alert02Icon,
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { generator } from "@/lib/microcopy";
import { cn } from "@/lib/utils";

const SQL_WARNING_DISMISS_PREFIX = "generator-sql-warning-dismissed";

function getSqlWarningDismissKey(sessionId: string) {
  return `${SQL_WARNING_DISMISS_PREFIX}:${sessionId}`;
}

function readSqlWarningDismissed(sessionId: string) {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(getSqlWarningDismissKey(sessionId)) === "1";
}

function persistSqlWarningDismissed(sessionId: string) {
  localStorage.setItem(getSqlWarningDismissKey(sessionId), "1");
}

type GeneratorSqlWarningProps = {
  sessionId: string;
  className?: string;
};

function GeneratorSqlWarning({ sessionId, className }: GeneratorSqlWarningProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    setDismissed(readSqlWarningDismissed(sessionId));
  }, [sessionId]);

  const handleDismiss = useCallback(() => {
    persistSqlWarningDismissed(sessionId);
    setDismissed(true);
  }, [sessionId]);

  if (dismissed === null || dismissed) {
    return null;
  }

  return (
    <Alert variant="warning" className={cn("w-full px-3 py-2.5", className)}>
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
      <AlertTitle className="text-xs">{generator.sqlWarningTitle}</AlertTitle>
      <AlertDescription className="text-xs">
        {generator.sqlWarningDescription}{" "}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="font-medium text-amber-800 underline underline-offset-2 transition-colors hover:text-amber-950 dark:text-amber-200 dark:hover:text-amber-50"
            >
              {generator.sqlWarningLearnMore}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="top"
            className="w-80 gap-3 p-4"
          >
            <PopoverHeader className="gap-2">
              <div className="flex items-start gap-2">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  strokeWidth={2}
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 space-y-1">
                  <PopoverTitle className="text-sm leading-snug">
                    {generator.sqlWarningLearnMoreTitle}
                  </PopoverTitle>
                  <PopoverDescription className="text-xs leading-relaxed">
                    {generator.sqlWarningLearnMoreBody}
                  </PopoverDescription>
                </div>
              </div>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </AlertDescription>
      <AlertAction>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-amber-700 hover:bg-amber-500/15 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-50"
          onClick={handleDismiss}
          aria-label="Tutup peringatan"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      </AlertAction>
    </Alert>
  );
}

export { GeneratorSqlWarning };