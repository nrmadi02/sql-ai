"use client";

import {
  AiBrain02Icon,
  Bookmark01Icon,
  BubbleChatSpark01Icon,
  ConnectIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import { cn } from "@/lib/utils";

const steps: { title: string; description: string; icon: IconSvgElement }[] = [
  {
    title: "Hubungkan database",
    description: "PostgreSQL atau MySQL. Schemanya dibaca otomatis.",
    icon: ConnectIcon,
  },
  {
    title: "Tanya dalam Bahasa Indonesia",
    description: "Sebut tabel pakai /nama_tabel supaya konteksnya jelas.",
    icon: BubbleChatSpark01Icon,
  },
  {
    title: "AI susun query SQL",
    description: "Pertanyaan Anda diubah jadi SQL yang siap dijalankan.",
    icon: AiBrain02Icon,
  },
  {
    title: "Edit dan jalankan",
    description: "Periksa SQL dulu. Hanya query read-only yang diizinkan.",
    icon: PlayIcon,
  },
  {
    title: "Simpan atau salin",
    description: "Query yang berguna bisa disimpan untuk dipakai lagi.",
    icon: Bookmark01Icon,
  },
];

function LandingHowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <h2 className="max-w-[28ch] font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Dari pertanyaan ke data, lima langkah.
          </h2>
        </LandingReveal>

        <div className="mt-12 hidden lg:grid lg:grid-cols-5 lg:gap-4">
          {steps.map((step, index) => (
            <LandingReveal key={step.title} delay={index * 0.06}>
              <div className="relative flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-5">
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-9 -right-2 z-10 hidden h-px w-4 bg-border lg:block"
                  />
                ) : null}
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <HugeiconsIcon
                    icon={step.icon}
                    strokeWidth={2}
                    className="size-5"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-sm tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </LandingReveal>
          ))}
        </div>

        <ol className="mt-10 space-y-4 lg:hidden">
          {steps.map((step, index) => (
            <LandingReveal key={step.title} delay={index * 0.05}>
              <li className="flex gap-4 rounded-lg border border-border bg-card p-4">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground",
                  )}
                >
                  <HugeiconsIcon
                    icon={step.icon}
                    strokeWidth={2}
                    className="size-5"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-sm tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </li>
            </LandingReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

export { LandingHowItWorks };
