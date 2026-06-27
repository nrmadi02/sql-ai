"use client";

import { Add01Icon, AiBrain02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { AiProviderForm } from "@/components/ai-provider/ai-provider-form";
import { AiProviderList } from "@/components/ai-provider/ai-provider-list";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useAiProviders } from "@/hooks/use-ai-provider";
import { buttons } from "@/lib/microcopy";
import type { AiProvider } from "@/lib/types";

function AiProvidersSettings() {
  const { data, isLoading } = useAiProviders();
  const [selected, setSelected] = useState<AiProvider | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const hasProviders = Boolean(data?.length);
  const showForm = isCreating || selected !== null || !hasProviders;

  function handleAdd() {
    setSelected(null);
    setIsCreating(true);
  }

  function handleSelect(provider: AiProvider) {
    setSelected(provider);
    setIsCreating(false);
  }

  function handleFormSuccess() {
    setIsCreating(false);
    setSelected(null);
  }

  function handleCancel() {
    setIsCreating(false);
    setSelected(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            AI provider
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Daftarkan provider yang mengubah pertanyaan menjadi SQL. Mendukung
            format OpenAI-compatible dan Anthropic-compatible.
          </p>
        </div>
        {hasProviders ? (
          <Button onClick={handleAdd}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            {buttons.registerProvider}
          </Button>
        ) : null}
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
        <section className="flex min-h-[280px] flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-sm font-semibold">
              Daftar provider
            </h2>
            {!isLoading && hasProviders ? (
              <span className="font-mono text-muted-foreground text-xs">
                {data?.length} provider
              </span>
            ) : null}
          </div>

          {!isLoading && !hasProviders ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20">
              <EmptyState
                icon={AiBrain02Icon}
                title="Belum ada AI provider"
                description="Daftarkan provider seperti OpenAI, Anthropic, Groq, atau Ollama lokal. SQL AI butuh satu provider aktif untuk bekerja."
                action={
                  <Button onClick={handleAdd}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                    {buttons.registerProvider}
                  </Button>
                }
              />
            </div>
          ) : (
            <AiProviderList selectedId={selected?.id} onSelect={handleSelect} />
          )}
        </section>

        {showForm ? (
          <aside className="rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm lg:sticky lg:top-4">
            <AiProviderForm
              key={selected?.id ?? (isCreating ? "create" : "empty")}
              provider={selected}
              onSuccess={handleFormSuccess}
              onCancel={hasProviders ? handleCancel : undefined}
            />
          </aside>
        ) : (
          <aside className="hidden rounded-xl border border-dashed border-border/80 bg-muted/15 p-8 lg:flex lg:items-center lg:justify-center">
            <p className="max-w-[28ch] text-center text-muted-foreground text-sm leading-relaxed">
              Pilih provider dari daftar untuk mengubah, atau daftarkan provider
              baru.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

export { AiProvidersSettings };
