"use client";

import {
  AiBrain02Icon,
  Database02Icon,
  LanguageSkillIcon,
  LayoutTable02Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import { cn } from "@/lib/utils";

type FeatureCell = {
  title: string;
  description: string;
  icon: IconSvgElement;
  className: string;
};

const features: FeatureCell[] = [
  {
    title: "PostgreSQL dan MySQL",
    description:
      "Sambungkan database yang sudah dipakai tim. Tidak perlu migrasi data.",
    icon: Database02Icon,
    className: "lg:col-span-7 bg-secondary/70",
  },
  {
    title: "Bahasa Indonesia penuh",
    description:
      "Tulis pertanyaan seperti chat biasa. Tidak perlu hafal sintaks SQL.",
    icon: LanguageSkillIcon,
    className: "lg:col-span-5",
  },
  {
    title: "/tabel untuk konteks",
    description:
      "Ketik /pesanan atau /pelanggan di chat agar AI tahu tabel mana yang dimaksud.",
    icon: LayoutTable02Icon,
    className: "lg:col-span-4 bg-accent/50",
  },
  {
    title: "AI provider pilihan sendiri",
    description:
      "OpenAI, Anthropic, Groq, atau Ollama lokal. Anda yang tentukan.",
    icon: AiBrain02Icon,
    className:
      "lg:col-span-4 lg:row-span-2 bg-gradient-to-br from-primary/10 via-transparent to-accent/30",
  },
  {
    title: "Query aman, read-only",
    description:
      "DELETE dan DROP diblokir. Data tetap aman saat tim bisnis mengeksplorasi.",
    icon: SecurityCheckIcon,
    className: "lg:col-span-4 bg-secondary/70",
  },
];

function LandingFeatures() {
  return (
    <section id="fitur" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <LandingReveal>
          <h2 className="max-w-[24ch] font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Fitur yang membuat data lebih dekat
          </h2>
          <p className="mt-3 max-w-[48ch] text-muted-foreground text-base leading-relaxed">
            Dibangun untuk tim bisnis yang butuh jawaban cepat, bukan kursus
            SQL.
          </p>
        </LandingReveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2">
          {features.map((feature, index) => (
            <LandingReveal
              key={feature.title}
              delay={index * 0.06}
              className={cn(
                "flex flex-col gap-4 rounded-lg border border-border p-6",
                feature.className,
              )}
            >
              <div className="flex size-11 items-center justify-center rounded-lg bg-background/80 text-primary shadow-sm">
                <HugeiconsIcon
                  icon={feature.icon}
                  strokeWidth={2}
                  className="size-5"
                />
              </div>
              <div>
                <h3 className="font-medium text-base tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export { LandingFeatures };
