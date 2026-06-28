"use client";

import { AiMagicIcon, FilterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { chart } from "@/lib/microcopy";
import { cn } from "@/lib/utils";

type ChartSuggestionsProps = {
  title: string;
  suggestions: string[];
  onSelect?: (suggestion: string) => void;
  disabled?: boolean;
  actionable?: boolean;
  isLoading?: boolean;
  variant?: "aggregation" | "filter";
  className?: string;
};

function ChartSuggestions({
  title,
  suggestions,
  onSelect,
  disabled = false,
  actionable = false,
  isLoading = false,
  variant = "aggregation",
  className,
}: ChartSuggestionsProps) {
  if (!suggestions.length && !isLoading) {
    return null;
  }

  const icon = variant === "filter" ? FilterIcon : AiMagicIcon;
  const isInteractive = Boolean(onSelect) && !disabled;

  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-muted/15 px-3 py-3 transition-colors",
        className,
      )}
      aria-live="polite"
    >
      <div className="mb-2 flex items-center gap-2">
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="size-3.5 shrink-0 text-muted-foreground"
        />
        <p className="font-medium text-muted-foreground text-[0.65rem] uppercase tracking-wide">
          {title}
        </p>
        {isLoading ? (
          <Spinner className="size-3 text-muted-foreground" />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={!isInteractive}
            onClick={() => onSelect?.(suggestion)}
            className={cn(
              "group inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-left text-xs leading-snug transition-all",
              isInteractive &&
                "cursor-pointer border-border/70 bg-card/80 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
              !isInteractive &&
                "cursor-default border-border/50 bg-muted/20 opacity-90",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <span className="truncate">{suggestion}</span>
            {actionable && isInteractive ? (
              <Badge
                variant="secondary"
                className="h-4 shrink-0 px-1.5 text-[0.6rem] transition-colors group-hover:bg-primary/10 group-hover:text-primary"
              >
                {chart.recommendationChipLabel}
              </Badge>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}

export { ChartSuggestions };