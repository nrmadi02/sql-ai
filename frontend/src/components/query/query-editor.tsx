"use client";

import { MySQL, PostgreSQL, sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { useSchemaCompletions } from "@/hooks/use-schema-completions";
import type { DatasourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

type QueryEditorProps = {
  value: string;
  dbType?: DatasourceType;
  datasourceId?: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  minHeight?: string;
};

function QueryEditor({
  value,
  dbType = "postgresql",
  datasourceId = null,
  readOnly = false,
  onChange,
  className,
  minHeight = "120px",
}: QueryEditorProps) {
  const { resolvedTheme } = useTheme();
  const completionsQuery = useSchemaCompletions(readOnly ? null : datasourceId);

  const extensions = useMemo(() => {
    const dialect = dbType === "mysql" ? MySQL : PostgreSQL;
    return [
      sql({
        dialect,
        schema: completionsQuery.data,
        upperCaseKeywords: true,
      }),
    ];
  }, [completionsQuery.data, dbType]);

  const theme = resolvedTheme === "dark" ? oneDark : undefined;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/70 bg-muted/20",
        className,
      )}
    >
      <CodeMirror
        value={value}
        height={minHeight}
        theme={theme}
        extensions={extensions}
        editable={!readOnly}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: !readOnly,
          bracketMatching: true,
        }}
        onChange={(next) => onChange?.(next)}
        className="text-xs [&_.cm-editor]:bg-transparent [&_.cm-scroller]:font-mono"
      />
    </div>
  );
}

export { QueryEditor };
