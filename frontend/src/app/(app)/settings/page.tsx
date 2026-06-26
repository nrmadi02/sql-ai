import {
  AiBrain02Icon,
  ArrowRight01Icon,
  Database02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Settings: entry point to datasources and AI providers.
export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Pengaturan
        </h1>
        <p className="text-muted-foreground text-sm">
          Kelola koneksi database dan AI provider yang dipakai SQL AI.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
          <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <HugeiconsIcon
              icon={Database02Icon}
              strokeWidth={2}
              className="size-5"
            />
          </div>
          <h2 className="mt-3 font-heading text-sm font-semibold">
            Datasource
          </h2>
          <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
            Tambah, ubah, atau tes koneksi database PostgreSQL dan MySQL.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-3">
            <Link href="/settings/datasources">
              Kelola datasource
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Link>
          </Button>
        </div>

        <div className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
          <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <HugeiconsIcon
              icon={AiBrain02Icon}
              strokeWidth={2}
              className="size-5"
            />
          </div>
          <h2 className="mt-3 font-heading text-sm font-semibold">
            AI provider
          </h2>
          <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
            Daftarkan AI milikmu: nama, base URL, API key, dan model. Mendukung
            format OpenAI dan Anthropic.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-3">
            <Link href="/settings/ai-providers">
              Kelola AI provider
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
