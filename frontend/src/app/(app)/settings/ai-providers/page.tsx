import { Add01Icon, AiBrain02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

// Settings > AI providers. No provider yet -> empty state + register CTA.
export default function AiProvidersPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          AI provider
        </h1>
        <p className="text-muted-foreground text-sm">
          AI yang mengubah pertanyaan menjadi SQL.
        </p>
      </header>

      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={AiBrain02Icon}
          title="Belum ada AI provider"
          description="Daftarkan provider seperti OpenAI, Anthropic, Groq, atau Ollama lokal. SQL AI butuh satu provider aktif untuk bekerja."
          action={
            <Button>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Daftarkan provider
            </Button>
          }
        />
      </div>
    </div>
  );
}
