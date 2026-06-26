"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { LandingHeroPreview } from "@/components/marketing/landing-hero-preview";
import { Button } from "@/components/ui/button";

function LandingHero() {
  const reduced = useReducedMotion();

  const textMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as const },
      };

  const visualMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.6,
          delay: 0.12,
          ease: [0.25, 0.1, 0.25, 1] as const,
        },
      };

  return (
    <section className="flex min-h-[100dvh] items-center pt-20 pb-16 lg:pt-24">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14">
        <motion.div {...textMotion} className="flex flex-col gap-6">
          <h1 className="max-w-[14ch] font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Tanya database pakai bahasa biasa
          </h1>
          <p className="max-w-[42ch] text-muted-foreground text-base leading-relaxed sm:text-lg">
            Tulis pertanyaan dalam Bahasa Indonesia. SQL AI menyusun query-nya.
            Jalankan dan lihat hasilnya tanpa menunggu tim teknis.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="h-11 whitespace-nowrap rounded-lg px-6 text-sm"
            >
              <Link href="/generator">
                Mulai
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 whitespace-nowrap rounded-lg px-6 text-sm"
            >
              <a href="#cara-kerja">Lihat cara kerja</a>
            </Button>
          </div>
        </motion.div>

        <motion.div {...visualMotion} className="w-full lg:justify-self-end">
          <LandingHeroPreview />
        </motion.div>
      </div>
    </section>
  );
}

export { LandingHero };
