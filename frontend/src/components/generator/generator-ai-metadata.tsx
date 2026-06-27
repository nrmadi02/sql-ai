"use client";

import {
  ArrowDown01Icon,
  Database01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { generator } from "@/lib/microcopy";
import type { AIMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";

type GeneratorAIMetadataProps = {
  metadata: AIMetadata;
  isStreaming?: boolean;
  className?: string;
};

function formatTokenCount(value?: number) {
  if (value === undefined || value === null) {
    return null;
  }
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatApiFormat(format: AIMetadata["api_format"]) {
  return format === "openai" ? "OpenAI" : "Anthropic";
}

function MetadataMetric({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[0.625rem] text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span
        className={cn(
          "truncate text-xs text-foreground",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function GeneratorAIMetadata({
  metadata,
  isStreaming = false,
  className,
}: GeneratorAIMetadataProps) {
  const contextTables = metadata.context_tables ?? [];
  const totalTokens =
    metadata.total_tokens ??
    (metadata.prompt_tokens !== undefined &&
    metadata.completion_tokens !== undefined
      ? metadata.prompt_tokens + metadata.completion_tokens
      : undefined);
  const summaryTokens =
    formatTokenCount(totalTokens) ??
    formatTokenCount(metadata.estimated_context_tokens) ??
    "0";

  return (
    <Collapsible
      className={cn(
        "w-full rounded-lg border border-border/50 bg-muted/15",
        className,
      )}
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/25">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-background/80 text-muted-foreground">
            <HugeiconsIcon
              icon={SparklesIcon}
              strokeWidth={2}
              className="size-3.5"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-[0.7rem] text-foreground">
              {metadata.provider_name || generator.aiMetaProvider}
            </p>
            <p className="truncate font-mono text-[0.65rem] text-muted-foreground tabular-nums">
              {metadata.model}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="font-mono tabular-nums">
            {isStreaming && totalTokens === undefined
              ? `~${summaryTokens}`
              : summaryTokens}{" "}
            token
          </Badge>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-border/50 border-t px-3 py-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetadataMetric
            label={generator.aiMetaProvider}
            value={metadata.provider_name}
          />
          <MetadataMetric
            label={generator.aiMetaModel}
            value={metadata.model}
            mono
          />
          <MetadataMetric
            label={generator.aiMetaDialect}
            value={metadata.dialect}
            mono
          />
          <MetadataMetric
            label="Format API"
            value={formatApiFormat(metadata.api_format)}
          />
          <MetadataMetric
            label={generator.aiMetaAvailableTables}
            value={String(metadata.available_tables_count)}
            mono
          />
          <MetadataMetric
            label={generator.aiMetaHistory}
            value={`${metadata.history_messages_count} pesan`}
            mono
          />
          <MetadataMetric
            label={generator.aiMetaEstimatedContext}
            value={`${formatTokenCount(metadata.estimated_context_tokens) ?? "0"} token`}
            mono
          />
          <MetadataMetric
            label={generator.aiMetaTotalTokens}
            value={
              isStreaming && totalTokens === undefined
                ? generator.aiMetaPendingTokens
                : `${formatTokenCount(totalTokens) ?? "0"} token`
            }
            mono
          />
        </div>

        {(metadata.prompt_tokens !== undefined ||
          metadata.completion_tokens !== undefined) && (
          <div className="mt-3 grid gap-3 border-border/40 border-t pt-3 sm:grid-cols-2">
            {metadata.prompt_tokens !== undefined ? (
              <MetadataMetric
                label={generator.aiMetaPromptTokens}
                value={`${formatTokenCount(metadata.prompt_tokens)} token`}
                mono
              />
            ) : null}
            {metadata.completion_tokens !== undefined ? (
              <MetadataMetric
                label={generator.aiMetaCompletionTokens}
                value={`${formatTokenCount(metadata.completion_tokens)} token`}
                mono
              />
            ) : null}
          </div>
        )}

        <div className="mt-3 border-border/40 border-t pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-[0.625rem] text-muted-foreground uppercase tracking-wide">
            <HugeiconsIcon
              icon={Database01Icon}
              strokeWidth={2}
              className="size-3"
            />
            {generator.aiMetaContextTables}
          </div>
          {contextTables.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {contextTables.map((table) => (
                <Badge key={table} variant="secondary" className="font-mono">
                  {table}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              {generator.aiMetaNoContextTables}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { GeneratorAIMetadata };
