import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function LandingCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-lg bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
          <h2 className="mx-auto max-w-[22ch] font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Data yang Anda butuhkan, tanpa menulis SQL
          </h2>
          <div className="mt-8 flex justify-center">
            <Button
              asChild
              variant="secondary"
              className="h-11 whitespace-nowrap rounded-lg px-6 text-sm text-secondary-foreground"
            >
              <Link href="/generator">
                Mulai
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export { LandingCta };
