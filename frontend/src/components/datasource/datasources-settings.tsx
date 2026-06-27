"use client";

import { Add01Icon, ConnectIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { DatasourceForm } from "@/components/datasource/datasource-form";
import { DatasourceList } from "@/components/datasource/datasource-list";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useDatasources } from "@/hooks/use-datasource";
import { buttons } from "@/lib/microcopy";
import type { Datasource } from "@/lib/types";

function DatasourcesSettings() {
  const { data, isLoading } = useDatasources();
  const [selected, setSelected] = useState<Datasource | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const hasDatasources = Boolean(data?.length);
  const showForm = isCreating || selected !== null || !hasDatasources;

  function handleAdd() {
    setSelected(null);
    setIsCreating(true);
  }

  function handleSelect(datasource: Datasource) {
    setSelected(datasource);
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
            Datasource
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Hubungkan database PostgreSQL atau MySQL. SQL AI membaca schema
            supaya pertanyaan di generator lebih tepat.
          </p>
        </div>
        {hasDatasources ? (
          <Button onClick={handleAdd}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            {buttons.addDatasource}
          </Button>
        ) : null}
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
        <section className="flex min-h-[280px] flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-sm font-semibold">
              Daftar koneksi
            </h2>
            {!isLoading && hasDatasources ? (
              <span className="font-mono text-muted-foreground text-xs">
                {data?.length} datasource
              </span>
            ) : null}
          </div>

          {!isLoading && !hasDatasources ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20">
              <EmptyState
                icon={ConnectIcon}
                title="Belum ada datasource"
                description="Tambahkan database PostgreSQL atau MySQL. Setelah tersimpan, kamu bisa tes koneksi dan mulai bertanya di generator."
                action={
                  <Button onClick={handleAdd}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                    {buttons.addDatasource}
                  </Button>
                }
              />
            </div>
          ) : (
            <DatasourceList selectedId={selected?.id} onSelect={handleSelect} />
          )}
        </section>

        {showForm ? (
          <aside className="rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm lg:sticky lg:top-4">
            <DatasourceForm
              key={selected?.id ?? (isCreating ? "create" : "empty")}
              datasource={selected}
              onSuccess={handleFormSuccess}
              onCancel={hasDatasources ? handleCancel : undefined}
            />
          </aside>
        ) : (
          <aside className="hidden rounded-xl border border-dashed border-border/80 bg-muted/15 p-8 lg:flex lg:items-center lg:justify-center">
            <p className="max-w-[28ch] text-center text-muted-foreground text-sm leading-relaxed">
              Pilih datasource dari daftar untuk mengubah, atau tambah koneksi
              baru.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

export { DatasourcesSettings };
