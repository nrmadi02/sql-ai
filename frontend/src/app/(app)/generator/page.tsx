"use client";

import {
  AiBrain02Icon,
  ArrowRight01Icon,
  BubbleChatSpark01Icon,
  ConnectIcon,
  Database02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import * as React from "react";
import { EmptyState } from "@/components/empty-state";
import { useActiveDatasource } from "@/components/providers/datasource-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAiProviders } from "@/hooks/use-ai-provider";
import { useDatasources } from "@/hooks/use-datasource";
import {
  useCreateGeneratorSession,
  useGeneratorSessions,
} from "@/hooks/use-generator";
import { buttons } from "@/lib/microcopy";

function SetupSteps({
  hasDatasource,
  hasAiProvider,
}: {
  hasDatasource: boolean;
  hasAiProvider: boolean;
}) {
  const steps = [
    {
      label: "Hubungkan database",
      done: hasDatasource,
      icon: Database02Icon,
    },
    {
      label: "Daftarkan AI provider",
      done: hasAiProvider,
      icon: AiBrain02Icon,
    },
  ];

  return (
    <div className="flex items-center gap-3 text-xs">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex items-center gap-1.5">
            <span
              className={
                step.done
                  ? "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  : "flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground"
              }
            >
              <HugeiconsIcon
                icon={step.icon}
                strokeWidth={2}
                className="size-3"
              />
            </span>
            <span
              className={
                step.done
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 ? <span className="text-border">/</span> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function GeneratorPage() {
  const { data: datasources, isLoading: datasourcesLoading } = useDatasources();
  const { data: providers, isLoading: providersLoading } = useAiProviders();
  const { data: sessions, isLoading: sessionsLoading } = useGeneratorSessions();
  const { activeDatasourceId } = useActiveDatasource();
  const createSession = useCreateGeneratorSession();

  const activeDatasources = datasources?.filter((item) => item.is_active) ?? [];
  const hasDatasource = activeDatasources.length > 0;
  const hasAiProvider = (providers?.length ?? 0) > 0;
  const defaultProvider = providers?.find((item) => item.is_default);

  const isLoading = datasourcesLoading || providersLoading;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!hasDatasource) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={ConnectIcon}
          title="Mulai dengan menghubungkan database"
          description="SQL AI butuh tahu ke mana harus bertanya. Tambahkan datasource PostgreSQL atau MySQL, nanti schemanya dibaca otomatis."
          action={
            <Button asChild>
              <Link href="/settings/datasources">
                Tambah datasource
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Link>
            </Button>
          }
        >
          <SetupSteps
            hasDatasource={hasDatasource}
            hasAiProvider={hasAiProvider}
          />
        </EmptyState>
      </div>
    );
  }

  if (!hasAiProvider) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={AiBrain02Icon}
          title="Satu langkah lagi: daftarkan AI"
          description="Database sudah tersambung. Sekarang daftarkan AI provider (OpenAI, Anthropic, Groq, atau lokal seperti Ollama) supaya pertanyaanmu bisa diubah jadi SQL."
          action={
            <Button asChild>
              <Link href="/settings/ai-providers">
                Daftarkan AI provider
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Link>
            </Button>
          }
        >
          <SetupSteps
            hasDatasource={hasDatasource}
            hasAiProvider={hasAiProvider}
          />
        </EmptyState>
      </div>
    );
  }

  const latestSession = sessions?.[0];

  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={BubbleChatSpark01Icon}
        title="Mulai pertanyaan baru"
        description="Ketik pertanyaan tentang datamu. Sebut tabel pakai garis miring, misalnya /pesanan, untuk membantu AI memahami konteks."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              disabled={createSession.isPending}
              onClick={() =>
                createSession.mutate({
                  datasource_id: activeDatasourceId ?? undefined,
                  ai_provider_id: defaultProvider?.id,
                })
              }
            >
              {createSession.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={BubbleChatSpark01Icon} strokeWidth={2} />
              )}
              {buttons.newSession}
            </Button>
            {latestSession && !sessionsLoading ? (
              <Button variant="outline" asChild>
                <Link href={`/generator/${latestSession.id}`}>
                  Lanjutkan percakapan terakhir
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />
    </div>
  );
}

export default GeneratorPage;
