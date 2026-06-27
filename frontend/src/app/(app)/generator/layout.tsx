import type * as React from "react";
import { GeneratorShell } from "@/components/layout/generator-shell";

export default function GeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GeneratorShell>{children}</GeneratorShell>;
}
