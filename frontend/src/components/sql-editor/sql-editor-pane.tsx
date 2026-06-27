"use client";

import { autocompletion } from "@codemirror/autocomplete";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import {
  MySQL,
  PostgreSQL,
  keywordCompletionSource,
  schemaCompletionSource,
  sql,
} from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useTheme } from "next-themes";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SqlEditorPaneHandle } from "@/hooks/use-sql-editor-workspace";
import { formatSql } from "@/lib/sql-format";
import { snippetCompletions } from "@/lib/sql-snippets";
import type { DatasourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

const setErrorLineEffect = StateEffect.define<number | null>();

const errorLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setErrorLineEffect)) {
        if (effect.value === null) return Decoration.none;
        const line = transaction.state.doc.line(
          Math.min(effect.value, transaction.state.doc.lines),
        );
        return Decoration.set([
          Decoration.line({ class: "cm-errorLine" }).range(line.from),
        ]);
      }
    }
    return decorations.map(transaction.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

type SqlEditorPaneProps = {
  value: string;
  dbType?: DatasourceType;
  schema?: Record<string, string[]>;
  errorLine?: number | null;
  onChange?: (value: string) => void;
  onRun?: () => void;
  onFormat?: () => void;
  className?: string;
  minHeight?: string;
};

const SqlEditorPane = forwardRef<SqlEditorPaneHandle, SqlEditorPaneProps>(
  function SqlEditorPane(
    {
      value,
      dbType = "postgresql",
      schema,
      errorLine = null,
      onChange,
      onRun,
      onFormat,
      className,
      minHeight = "200px",
    },
    ref,
  ) {
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<ReactCodeMirrorRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [editorHeight, setEditorHeight] = useState(200);

    useEffect(() => {
      const node = containerRef.current;
      if (!node) return;

      const updateHeight = () => {
        const next = Math.max(node.clientHeight, 160);
        setEditorHeight(next);
      };

      updateHeight();
      const observer = new ResizeObserver(updateHeight);
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    const extensions = useMemo(() => {
      const dialect = dbType === "mysql" ? MySQL : PostgreSQL;
      const sqlConfig = {
        dialect,
        schema: schema ?? {},
        upperCaseKeywords: true,
      };

      const runKeymap = keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            onRun?.();
            return true;
          },
        },
        {
          key: "Mod-Shift-f",
          run: (view) => {
            const formatted = formatSql(view.state.doc.toString());
            onChange?.(formatted);
            onFormat?.();
            return true;
          },
        },
      ]);

      return [
        lineNumbers(),
        sql(sqlConfig),
        autocompletion({
          override: [
            schemaCompletionSource(sqlConfig),
            keywordCompletionSource(dialect, true),
            snippetCompletions,
          ],
          activateOnTyping: true,
          maxRenderedOptions: 12,
        }),
        errorLineField,
        runKeymap,
        keymap.of([...defaultKeymap, indentWithTab]),
        EditorView.lineWrapping,
      ];
    }, [dbType, onChange, onFormat, onRun, schema]);

    const theme = resolvedTheme === "dark" ? oneDark : undefined;

    useEffect(() => {
      const view = editorRef.current?.view;
      if (!view) return;
      view.dispatch({
        effects: setErrorLineEffect.of(errorLine),
      });
    }, [errorLine]);

    const getView = useCallback(() => editorRef.current?.view ?? null, []);

    useImperativeHandle(
      ref,
      () => ({
        getSelection: () => {
          const view = getView();
          if (!view) return null;
          const { from, to } = view.state.selection.main;
          if (from === to) return null;
          return view.state.doc.sliceString(from, to);
        },
        insertText: (text: string) => {
          const view = getView();
          if (!view) return;
          const { from, to } = view.state.selection.main;
          view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length },
          });
          onChange?.(view.state.doc.toString());
        },
        formatDocument: () => {
          const view = getView();
          if (!view) return value;
          const formatted = formatSql(view.state.doc.toString());
          onChange?.(formatted);
          return formatted;
        },
        focus: () => {
          getView()?.focus();
        },
      }),
      [getView, onChange, value],
    );

    const resolvedHeight =
      className?.includes("h-full") || minHeight === "100%"
        ? `${editorHeight}px`
        : minHeight;

    return (
      <div
        ref={containerRef}
        className={cn(
          "overflow-hidden border-border/70 bg-muted/15",
          className,
        )}
      >
        <CodeMirror
          ref={editorRef}
          value={value}
          height={resolvedHeight}
          theme={theme}
          extensions={extensions}
          editable
          basicSetup={{
            lineNumbers: false,
            foldGutter: true,
            highlightActiveLine: true,
            bracketMatching: true,
            autocompletion: false,
          }}
          onChange={(next) => onChange?.(next)}
          className={cn(
            "text-xs [&_.cm-editor]:bg-transparent [&_.cm-scroller]:font-mono",
            "[&_.cm-errorLine]:bg-destructive/10",
          )}
        />
      </div>
    );
  },
);

export { SqlEditorPane };
