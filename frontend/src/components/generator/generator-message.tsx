"use client";

import { AiBrain02Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { QueryPanel } from "@/components/query/query-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { generator } from "@/lib/microcopy";
import type { AIMetadata, DatasourceType, GeneratorMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GeneratorAIMetadata } from "./generator-ai-metadata";
import { TableMention } from "./table-mention";

type GeneratorMessageItemProps = {
  message: GeneratorMessage;
  dbType?: DatasourceType;
  datasourceId?: string | null;
  sessionId?: string;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingMetadata?: AIMetadata | null;
};

function MessageAvatar({
  role,
  isStreaming,
}: {
  role: GeneratorMessage["role"];
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {isStreaming ? (
        <Spinner className="size-4" />
      ) : (
        <HugeiconsIcon
          icon={isUser ? UserIcon : AiBrain02Icon}
          strokeWidth={2}
          className="size-4"
        />
      )}
    </div>
  );
}

function GeneratorMessageItem({
  message,
  dbType,
  datasourceId = null,
  sessionId,
  isStreaming = false,
  streamingContent,
  streamingMetadata = null,
}: GeneratorMessageItemProps) {
  const isUser = message.role === "user";
  const displayContent = isStreaming ? streamingContent || "" : message.content;
  const sql = message.generated_sql || message.edited_sql;
  const aiMetadata = isStreaming
    ? (streamingMetadata ?? message.ai_metadata)
    : message.ai_metadata;

  return (
    <article
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <MessageAvatar role={message.role} isStreaming={isStreaming} />

      <div
        className={cn(
          "flex min-w-0 max-w-[min(100%,42rem)] flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border border-border/60 bg-card text-card-foreground",
          )}
        >
          {isStreaming && !displayContent ? (
            <div className="flex flex-col gap-2 py-1">
              <span className="text-muted-foreground text-xs">
                {generator.generating}
              </span>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{displayContent}</p>
          )}
        </div>

        {isUser && message.referenced_tables?.length ? (
          <TableMention tables={message.referenced_tables} />
        ) : null}

        {!isUser && aiMetadata ? (
          <GeneratorAIMetadata
            metadata={aiMetadata}
            isStreaming={isStreaming}
          />
        ) : null}

        {!isUser && sql && sessionId ? (
          <div className="w-full space-y-1.5">
            <p className="font-medium text-muted-foreground text-[0.65rem] uppercase tracking-wide">
              {generator.sqlLabel}
            </p>
            <QueryPanel
              message={message}
              datasourceId={datasourceId}
              dbType={dbType}
              sessionId={sessionId}
            />
          </div>
        ) : null}

        {!isUser && isStreaming && displayContent && !sql ? (
          <div className="w-full space-y-1.5">
            <p className="font-medium text-muted-foreground text-[0.65rem] uppercase tracking-wide">
              {generator.sqlLabel}
            </p>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-full font-mono" />
                <Skeleton className="h-3 w-11/12 font-mono" />
                <Skeleton className="h-3 w-4/5 font-mono" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export { GeneratorMessageItem };
