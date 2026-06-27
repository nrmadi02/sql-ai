import type * as React from "react";
import { SqlEditorShell } from "@/components/layout/sql-editor-shell";

export default function SqlEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SqlEditorShell>{children}</SqlEditorShell>;
}
