"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";

type FeatureSheetBarProps = {
  title: string;
  actions?: React.ReactNode;
  className?: string;
};

function FeatureSheetBar({ title, actions, className }: FeatureSheetBarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-card/40 px-4 py-2",
        className,
      )}
    >
      <p className="font-heading text-sm font-medium tracking-tight">{title}</p>
      {actions ? (
        <div className="flex flex-wrap items-center gap-1.5">{actions}</div>
      ) : null}
    </div>
  );
}

export { FeatureSheetBar };
