"use client";

import { BubbleChatSpark01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { useActiveDatasource } from "@/components/providers/datasource-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useDatasources } from "@/hooks/use-datasource";
import {
  useGeneratorSession,
  useSendGeneratorMessage,
} from "@/hooks/use-generator";
import { chart, generator } from "@/lib/microcopy";
import type { GeneratorMessage } from "@/lib/types";
import { GeneratorInput } from "./generator-input";
import { GeneratorMessageItem } from "./generator-message";

type GeneratorWindowProps = {
  sessionId: string;
};

function MessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="size-8 shrink-0 rounded-lg" />
      <div className="flex w-full max-w-md flex-col gap-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function GeneratorWindow({ sessionId }: GeneratorWindowProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const { activeDatasourceId } = useActiveDatasource();
  const { data: datasources } = useDatasources();
  const sessionQuery = useGeneratorSession(sessionId);
  const { sendMessage, isStreaming, streamingContent, streamingMetadata } =
    useSendGeneratorMessage(sessionId);

  const activeDatasource = datasources?.find(
    (item) => item.id === activeDatasourceId,
  );

  const messages = sessionQuery.data?.messages ?? [];
  const scrollKey = `${messages.length}:${streamingContent.length}:${isStreaming}`;

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [scrollKey]);

  const handleSend = async (content: string, tables: string[]) => {
    if (!activeDatasourceId) {
      toast.error("Pilih datasource aktif dulu.");
      return;
    }
    if (isStreaming) {
      toast.message(chart.recommendationSending);
      return;
    }

    await sendMessage({
      content,
      tables,
      datasource_id: activeDatasourceId,
    });
  };

  const handleRecommendationClick = async (
    content: string,
    tables: string[] = [],
  ) => {
    if (!activeDatasourceId || isStreaming) {
      await handleSend(content, tables);
      return;
    }

    await sendMessage({
      content,
      tables,
      datasource_id: activeDatasourceId,
    });
    toast.success(chart.recommendationSent);
  };

  const streamingMessage: GeneratorMessage | null = isStreaming
    ? {
        id: "streaming",
        session_id: sessionId,
        role: "assistant",
        content: streamingContent,
        created_at: new Date().toISOString(),
      }
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={messagesRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
          {sessionQuery.isLoading ? (
            <>
              <MessageSkeleton />
              <MessageSkeleton />
            </>
          ) : messages.length === 0 && !isStreaming ? (
            <EmptyState
              icon={BubbleChatSpark01Icon}
              title="Pertanyaan pertama"
              description={generator.emptySession}
              className="py-12"
            />
          ) : (
            <>
              {messages.map((message) => (
                <GeneratorMessageItem
                  key={message.id}
                  message={message}
                  dbType={activeDatasource?.db_type}
                  datasourceId={activeDatasourceId}
                  sessionId={sessionId}
                  onRecommendationClick={(content) =>
                    handleRecommendationClick(
                      content,
                      message.referenced_tables ?? [],
                    )
                  }
                  isRecommendationPending={isStreaming}
                />
              ))}
              {streamingMessage ? (
                <GeneratorMessageItem
                  message={streamingMessage}
                  dbType={activeDatasource?.db_type}
                  datasourceId={activeDatasourceId}
                  sessionId={sessionId}
                  isStreaming
                  streamingContent={streamingContent}
                  streamingMetadata={streamingMetadata}
                  isRecommendationPending
                />
              ) : null}
            </>
          )}
        </div>
      </div>

      <GeneratorInput
        onSend={handleSend}
        disabled={!activeDatasourceId}
        isStreaming={isStreaming}
      />
    </div>
  );
}

export { GeneratorWindow };
