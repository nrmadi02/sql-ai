import { BubbleChatSpark01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Potongan UI produk nyata: chat, editor SQL, dan tabel hasil.
// Bukan mockup berbasis div kosong.
function LandingHeroPreview() {
  return (
    <Card className="overflow-hidden border-border/80 bg-card shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HugeiconsIcon
              icon={BubbleChatSpark01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          </div>
          <div>
            <p className="font-medium text-sm tracking-tight">Chat penjualan</p>
            <p className="text-muted-foreground text-[0.65rem]">
              PostgreSQL · read-only
            </p>
          </div>
        </div>
        <Button size="sm" className="h-7 gap-1.5 px-3 text-[0.7rem]">
          <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-3" />
          Jalankan
        </Button>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg bg-secondary px-3 py-2 text-sm leading-relaxed">
            Berapa total penjualan /pesanan bulan ini?
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="mb-2 text-muted-foreground text-[0.65rem] uppercase tracking-wide">
            SQL yang disusun
          </p>
          <pre className="overflow-x-auto font-mono text-[0.7rem] leading-relaxed text-foreground">
            <code>{`SELECT SUM(total)
FROM pesanan
WHERE created_at >= DATE_TRUNC('month', NOW());`}</code>
          </pre>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-[0.7rem]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 font-medium">total_penjualan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 font-mono tabular-nums">
                  Rp 4.280.150.000
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

export { LandingHeroPreview };
