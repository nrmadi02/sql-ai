"use client";

import type * as React from "react";
import { GeneratorSessionsSheetTrigger } from "@/components/generator/generator-sessions-sheet";
import { FeatureSheetBar } from "@/components/layout/feature-sheet-bar";
type GeneratorShellProps = {
  children: React.ReactNode;
};

function GeneratorShell({ children }: GeneratorShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <FeatureSheetBar
        title="Generator"
        actions={<GeneratorSessionsSheetTrigger />}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export { GeneratorShell };
