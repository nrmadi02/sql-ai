import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type * as React from "react";
import { cn } from "@/lib/utils";

// Reusable empty state. Presentational (safe in Server Components).
// No div-based fake screenshots; icons from the HugeIcons family only.
type EmptyStateProps = {
  icon: IconSvgElement;
  title: string;
  description: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-6" />
      </div>
      <div className="flex max-w-[44ch] flex-col gap-1.5">
        <h3 className="font-heading text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
      {children}
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
