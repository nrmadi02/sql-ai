import { Add01Icon, ConnectIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

// Settings > Datasources. No connection yet -> empty state + add CTA.
// The CRUD form (multi-step) is shadcn/ui territory, not this skill. Here we
// only render the empty state and entry point.
export default function DatasourcesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Datasource
          </h1>
          <p className="text-muted-foreground text-sm">
            Database yang bisa ditanyai lewat generator.
          </p>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={ConnectIcon}
          title="Belum ada datasource"
          description="Tambahkan database PostgreSQL atau MySQL. SQL AI akan membaca schema dan menyimpannya untuk akses cepat."
          action={
            <Button>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Tambah datasource
            </Button>
          }
        />
      </div>
    </div>
  );
}
