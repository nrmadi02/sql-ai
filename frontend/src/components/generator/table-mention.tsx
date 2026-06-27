"use client";

import { TableIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TableMentionProps = {
  tables: string[];
  className?: string;
};

function TableMention({ tables, className }: TableMentionProps) {
  if (!tables.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {tables.map((table) => (
        <Badge
          key={table}
          variant="secondary"
          className="gap-1 font-mono text-[0.65rem]"
        >
          <HugeiconsIcon icon={TableIcon} strokeWidth={2} />/{table}
        </Badge>
      ))}
    </div>
  );
}

export { TableMention };
