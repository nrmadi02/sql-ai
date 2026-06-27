"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ConnectIcon, FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  useCreateDatasource,
  useTestDatasourceConnection,
  useUpdateDatasource,
} from "@/hooks/use-datasource";
import { buttons, formLabels, formPlaceholders } from "@/lib/microcopy";
import {
  type DatasourceFormValues,
  datasourceDefaultValues,
  datasourceSchema,
  dbTypePortDefaults,
} from "@/lib/schemas/datasource";
import type { Datasource } from "@/lib/types";
import { cn } from "@/lib/utils";

type DatasourceFormProps = {
  datasource?: Datasource | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
};

function DatasourceForm({
  datasource,
  onSuccess,
  onCancel,
  className,
}: DatasourceFormProps) {
  const isEditing = Boolean(datasource?.id);
  const createMutation = useCreateDatasource();
  const updateMutation = useUpdateDatasource(datasource?.id ?? "");
  const testMutation = useTestDatasourceConnection();

  const form = useForm<DatasourceFormValues>({
    resolver: zodResolver(datasourceSchema),
    defaultValues: datasource
      ? {
          name: datasource.name,
          db_type: datasource.db_type,
          host: datasource.host,
          port: datasource.port,
          database_name: datasource.database_name,
          username: datasource.username,
          password: "",
          ssl_mode: "disable",
        }
      : datasourceDefaultValues,
  });

  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const dbType = watch("db_type");
  const isBusy =
    isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending ||
    testMutation.isPending;

  async function onSubmit(values: DatasourceFormValues) {
    if (!values.password.trim()) {
      form.setError("password", {
        message: "Password wajib diisi untuk menyimpan",
      });
      return;
    }

    if (isEditing && datasource) {
      await updateMutation.mutateAsync({
        ...values,
        password: values.password,
        is_active: datasource.is_active,
      });
    } else {
      await createMutation.mutateAsync(values);
      form.reset(datasourceDefaultValues);
    }
    onSuccess?.();
  }

  async function handleTestConnection() {
    const values = form.getValues();
    const useSavedCredentials =
      isEditing && datasource?.id && !values.password.trim();

    if (!useSavedCredentials) {
      const valid = await form.trigger();
      if (!valid) return;
    }

    await testMutation.mutateAsync({
      values,
      datasourceId: useSavedCredentials ? datasource?.id : undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold tracking-tight">
          {isEditing ? "Ubah datasource" : "Datasource baru"}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {isEditing
            ? "Perbarui detail koneksi. Password kosong berarti tidak diubah."
            : "Isi detail koneksi PostgreSQL atau MySQL. Schema dibaca setelah tersimpan."}
        </p>
      </div>

      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">{formLabels.datasourceName}</FieldLabel>
          <Input
            id="name"
            placeholder={formPlaceholders.datasourceName}
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.db_type}>
            <FieldLabel>{formLabels.dbType}</FieldLabel>
            <Controller
              control={control}
              name="db_type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue(
                      "port",
                      dbTypePortDefaults[value as "postgresql" | "mysql"],
                    );
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.db_type]} />
          </Field>

          <Field data-invalid={!!errors.ssl_mode}>
            <FieldLabel>{formLabels.sslMode}</FieldLabel>
            <Controller
              control={control}
              name="ssl_mode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disable">Disable</SelectItem>
                    <SelectItem value="require">Require</SelectItem>
                    <SelectItem value="verify-full">Verify full</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.ssl_mode]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field data-invalid={!!errors.host}>
            <FieldLabel htmlFor="host">{formLabels.host}</FieldLabel>
            <Input
              id="host"
              placeholder={formPlaceholders.host}
              aria-invalid={!!errors.host}
              {...register("host")}
            />
            <FieldError errors={[errors.host]} />
          </Field>

          <Field data-invalid={!!errors.port}>
            <FieldLabel htmlFor="port">{formLabels.port}</FieldLabel>
            <Input
              id="port"
              type="number"
              inputMode="numeric"
              aria-invalid={!!errors.port}
              {...register("port", { valueAsNumber: true })}
            />
            <FieldDescription>
              Default {dbType === "mysql" ? "3306" : "5432"}
            </FieldDescription>
            <FieldError errors={[errors.port]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.database_name}>
          <FieldLabel htmlFor="database_name">
            {formLabels.databaseName}
          </FieldLabel>
          <Input
            id="database_name"
            placeholder={formPlaceholders.databaseName}
            aria-invalid={!!errors.database_name}
            {...register("database_name")}
          />
          <FieldError errors={[errors.database_name]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.username}>
            <FieldLabel htmlFor="username">{formLabels.username}</FieldLabel>
            <Input
              id="username"
              placeholder={formPlaceholders.username}
              autoComplete="off"
              aria-invalid={!!errors.username}
              {...register("username")}
            />
            <FieldError errors={[errors.username]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">{formLabels.password}</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {isEditing ? (
              <FieldDescription>
                Wajib diisi saat menyimpan. Kosongkan hanya untuk tes koneksi
                dengan kredensial tersimpan.
              </FieldDescription>
            ) : null}
            <FieldError errors={[errors.password]} />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        <Button type="submit" disabled={isBusy}>
          {isBusy && !testMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
          )}
          {isEditing ? buttons.saveChanges : buttons.addDatasource}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={handleTestConnection}
        >
          {testMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={ConnectIcon} strokeWidth={2} />
          )}
          {buttons.testConnection}
        </Button>

        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            onClick={onCancel}
          >
            {buttons.cancel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export { DatasourceForm };
