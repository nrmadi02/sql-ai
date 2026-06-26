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
import { Button } from "@/components/ui/button";
import type { SetupStatus } from "@/lib/types";

// Entry point app (/generator). Backend belum terhubung; status di bawah adalah MOCK
// eksplisit untuk tiga kondisi onboarding. Ganti dengan fetch ke
//   GET /api/v1/datasources  dan  GET /api/v1/ai-providers
// setelah backend siap.
const setupStatusMock: SetupStatus = {
  hasDatasource: false,
  hasAiProvider: false,
};

function SetupSteps({ status }: { status: SetupStatus }) {
  const steps = [
    {
      label: "Hubungkan database",
      done: status.hasDatasource,
      icon: Database02Icon,
    },
    {
      label: "Daftarkan AI provider",
      done: status.hasAiProvider,
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
  const status = setupStatusMock;

  if (!status.hasDatasource) {
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
          <SetupSteps status={status} />
        </EmptyState>
      </div>
    );
  }

  if (!status.hasAiProvider) {
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
          <SetupSteps status={status} />
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={BubbleChatSpark01Icon}
        title="Mulai pertanyaan baru"
        description="Ketik pertanyaan tentang datamu. Sebut tabel pakai garis miring, misalnya /pesanan, untuk membantu AI memahami konteks."
      />
    </div>
  );
}

export default GeneratorPage;
